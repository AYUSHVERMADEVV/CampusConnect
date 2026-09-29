const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");
const commentRoutes = require("./routes/commentRoutes");
const messageRoutes = require("./routes/messageRoutes");
const communityRoutes = require("./routes/communityRoutes");
const eventRoutes = require("./routes/eventRoutes");
const lostFoundRoutes = require("./routes/lostFoundRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config();

// Ensure JWT secret has a default for preview
process.env.JWT_SECRET = process.env.JWT_SECRET || "campus-connect-jwt-secret-key-2026";

const app = express();

// Ensure uploads directory exists (safely handle read-only filesystems)
try {
  const uploadDir1 = path.join(__dirname, "uploads", "posts");
  const uploadDir2 = path.join(__dirname, "..", "uploads", "posts");
  if (!fs.existsSync(uploadDir1)) fs.mkdirSync(uploadDir1, { recursive: true });
  if (!fs.existsSync(uploadDir2)) fs.mkdirSync(uploadDir2, { recursive: true });
} catch (e) {
  console.warn("Uploads directory creation warning:", e.message);
}

// Health check endpoints for Cloud Run and load balancers
app.get(["/healthz", "/health", "/api/healthz"], (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/lost-found", lostFoundRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

// File upload & client errors
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "Image must be 5 MB or smaller." });
  }

  if (error.status === 400) {
    return res.status(400).json({ message: error.message });
  }

  next(error);
});

// Route-level fallback for database offline
app.use((err, req, res, next) => {
  if (
    err.name === "MongooseError" ||
    err.name === "MongoNetworkError" ||
    (err.message && err.message.includes("buffering timed out"))
  ) {
    console.warn("[AI Studio] Database offline — returning fallback response");
    if (req.method === "GET") {
      return res.json(req.path.endsWith("s") || req.path.endsWith("s/") ? [] : {});
    }
    return res.status(503).json({ error: "Service temporarily unavailable (database offline)" });
  }
  next(err);
});

// Helper to resolve static client dist
function findClientDist() {
  const candidates = [
    path.join(__dirname, "../dist"),
    path.join(__dirname, "../client/dist"),
    path.join(__dirname, "dist"),
    path.join(process.cwd(), "dist"),
    path.join(process.cwd(), "client/dist"),
  ];
  return candidates.find((d) => fs.existsSync(d) && fs.existsSync(path.join(d, "index.html")));
}

// Serve client static assets dynamically
app.use((req, res, next) => {
  const dist = findClientDist();
  if (dist) {
    return express.static(dist)(req, res, next);
  }
  next();
});

// SPA fallback
app.use((req, res, next) => {
  if (
    req.method === "GET" &&
    !req.path.startsWith("/api") &&
    !req.path.startsWith("/uploads") &&
    req.path !== "/healthz" &&
    req.path !== "/health"
  ) {
    const dist = findClientDist();
    if (dist && fs.existsSync(path.join(dist, "index.html"))) {
      return res.sendFile(path.join(dist, "index.html"));
    }
    return res.status(200).send("Campus Hub API is running...");
  }
  next();
});

// MongoDB Connection
mongoose.set("bufferCommands", false); // CRITICAL: fail fast, don't hang

// Catch runtime mongoose connection errors to avoid uncaught exceptions
mongoose.connection.on("error", (error) => {
  console.warn("MongoDB connection event warning:", error.message);
});

let rawMongoUri = (process.env.MONGO_URI || process.env.MONGODB_URI || "").trim();
if (rawMongoUri.includes("JWT_SECRET=")) {
  const parts = rawMongoUri.split(/\s+JWT_SECRET=/i);
  rawMongoUri = parts[0].trim();
  if (parts[1] && !process.env.JWT_SECRET) {
    process.env.JWT_SECRET = parts[1].trim();
  }
}
if (rawMongoUri.includes(" ")) {
  rawMongoUri = rawMongoUri.split(/\s+/)[0].trim();
}
const MONGO_URI = rawMongoUri || null;

function getAdminEmail() {
  if (process.env.ADMIN_EMAIL) {
    return process.env.ADMIN_EMAIL.trim().toLowerCase();
  }
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/^ADMIN_EMAIL=(.*)$/m);
      if (match && match[1]) {
        return match[1].trim().toLowerCase();
      }
    }
  } catch (_) {}
  return "";
}

async function initAdminAccount() {
  const adminEmail = getAdminEmail();
  if (!adminEmail) return;

  try {
    const User = require("./models/User");
    const existing = await User.findOne({ email: adminEmail });
    if (existing && existing.role !== "admin") {
      existing.role = "admin";
      if (typeof existing.save === "function") {
        await existing.save();
      } else if (User.findByIdAndUpdate) {
        await User.findByIdAndUpdate(existing._id, { role: "admin" });
      }
      console.log(`Designated admin user initialized for ${adminEmail}`);
    }
  } catch (err) {
    console.warn("Admin initialization check warning:", err.message);
  }
}

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    })
    .then(() => {
      console.log("MongoDB Connected Successfully");
      initAdminAccount();
    })
    .catch((error) => {
      console.warn("MongoDB Connection Error, using in-memory store:", error.message);
      initAdminAccount();
    });
} else {
  console.log("No MONGO_URI provided — using in-memory store for instant preview.");
  initAdminAccount();
}

// Server port configuration:
// In AI Studio dev/preview container, Nginx occupies port 8080 and reverse-proxies to DEFAULT_APP_PORT (3000).
// In standalone Cloud Run production deployment, there is no Nginx and Cloud Run expects the server to listen on PORT (8080).
let cliPort = null;
const portArgIndex = process.argv.indexOf("--port");
if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
  const parsed = parseInt(process.argv[portArgIndex + 1], 10);
  if (!isNaN(parsed) && parsed > 0) {
    cliPort = parsed;
  }
}

const isDevWithNginx = Boolean(process.env.DEFAULT_APP_PORT || process.env.NGINX_PORT);
const primaryPort = cliPort || (isDevWithNginx
  ? parseInt(process.env.DEFAULT_APP_PORT || "3000", 10)
  : parseInt(process.env.PORT || "8080", 10));

const server = app.listen(primaryPort, "0.0.0.0", () => {
  console.log(`Server running on primary port ${primaryPort}`);
});

server.on("error", (err) => {
  console.error(`Server listen error on port ${primaryPort}:`, err);
});

let altServer = null;
const secondaryPort = isDevWithNginx ? null : (primaryPort !== 3000 ? 3000 : null);
if (secondaryPort) {
  altServer = app.listen(secondaryPort, "0.0.0.0", () => {
    console.log(`Server also listening on auxiliary port ${secondaryPort}`);
  });
  altServer.on("error", (err) => {
    if (err.code !== "EADDRINUSE") {
      console.warn(`Auxiliary port ${secondaryPort} listen warning:`, err.message);
    }
  });
}

// Process signal handlers
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  if (altServer) {
    try { altServer.close(); } catch (_) {}
  }
  server.close(() => process.exit(0));
});

process.on("unhandledRejection", (reason) => {
  console.warn("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.warn("Uncaught Exception:", error);
});

