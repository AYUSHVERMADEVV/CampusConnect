
const express = require("express");
const { createPost, getPosts } = require("../controllers/postController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Create a new post
router.get("/", getPosts);
router.post("/", protect, createPost);

module.exports = router;