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
const authRoutes = require("./routes/authRoutes");

dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config();

// Ensure JWT secret has a default for preview
process.env.JWT_SECRET = process.env.JWT_SECRET || "campus-connect-jwt-secret-key-2026";

const app = express();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads", "posts");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/events", eventRoutes);

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

// Static assets & SPA fallback
const clientDist = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api") && !req.path.startsWith("/uploads")) {
      return res.sendFile(path.join(clientDist, "index.html"));
    }
    next();
  });
} else {
  app.get("/", (req, res) => {
    res.send("CampusConnect API is running...");
  });
}

// MongoDB Connection
mongoose.set("bufferCommands", false); // CRITICAL: fail fast, don't hang
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log("MongoDB Connected Successfully");
    })
    .catch((error) => {
      console.warn("MongoDB Connection Error, using in-memory store:", error.message);
    });
} else {
  console.log("No MONGO_URI provided — using in-memory store for instant preview.");
}

// Server port: 3000 on 0.0.0.0
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

