const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

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

const registerUser = async (req, res) => {
  try {
    const { name, email, password, college, branch, year } = req.body;

    // Check required fields
    if (!name || !email || !password || !college || !branch || !year) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine role:
    // Never trust role from frontend.
    // If ADMIN_EMAIL is set and matches, assign "admin"; otherwise default to "student".
    const configuredAdminEmail = getAdminEmail();
    const normalizedEmail = email.trim().toLowerCase();
    const assignedRole =
      configuredAdminEmail && normalizedEmail === configuredAdminEmail
        ? "admin"
        : "student";

    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      college,
      branch,
      year,
      role: assignedRole,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        university: user.university || "",
        course: user.course || "",
        branch: user.branch,
        year: user.year,
        bio: user.bio || "",
        username: user.username || "",
        profilePicture: user.profilePicture || "",
      },
    });
  } catch (error) {
    console.error("Register Error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // If configured ADMIN_EMAIL matches an existing account, promote to admin safely
    const configuredAdminEmail = getAdminEmail();
    if (
      configuredAdminEmail &&
      user.email &&
      user.email.toLowerCase() === configuredAdminEmail &&
      user.role !== "admin"
    ) {
      user.role = "admin";
      try {
        if (typeof user.save === "function") {
          await user.save();
        } else if (User.findByIdAndUpdate) {
          await User.findByIdAndUpdate(user._id, { role: "admin" });
        }
      } catch (saveErr) {
        console.warn("Could not persist admin promotion on login:", saveErr.message);
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        university: user.university || "",
        course: user.course || "",
        branch: user.branch,
        year: user.year,
        bio: user.bio || "",
        username: user.username || "",
        profilePicture: user.profilePicture || "",
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};