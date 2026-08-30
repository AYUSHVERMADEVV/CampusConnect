const crypto = require("crypto");
const path = require("path");
const multer = require("multer");

const allowedMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "uploads", "posts"),
  filename: (req, file, callback) => {
    callback(null, `${crypto.randomUUID()}${allowedMimeTypes.get(file.mimetype)}`);
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

module.exports = { uploadPostImage };
