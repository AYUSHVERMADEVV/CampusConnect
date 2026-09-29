const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const allowedMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

const postsDir = path.join(__dirname, "..", "uploads", "posts");
if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir, { recursive: true });
}

const profilesDir = path.join(__dirname, "..", "uploads", "profiles");
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: postsDir,
  filename: (req, file, callback) => {
    callback(null, `${crypto.randomUUID()}${allowedMimeTypes.get(file.mimetype)}`);
  },
});

const profileStorage = multer.diskStorage({
  destination: profilesDir,
  filename: (req, file, callback) => {
    callback(null, `profile-${crypto.randomUUID()}${allowedMimeTypes.get(file.mimetype)}`);
  },
});

const uploadPostImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error("Only JPG, PNG, WEBP, or GIF images are allowed.");
      error.status = 400;
      return callback(error);
    }

    callback(null, true);
  },
});

const uploadProfilePicture = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error("Only JPG, PNG, WEBP, or GIF images are allowed.");
      error.status = 400;
      return callback(error);
    }

    callback(null, true);
  },
});

module.exports = { uploadPostImage, uploadProfilePicture };
