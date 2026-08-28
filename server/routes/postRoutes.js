
const express = require("express");
const {
  createPost,
  getPosts,
  toggleLikePost,
} = require("../controllers/postController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Create a new post
router.get("/", getPosts);
router.post("/", protect, createPost);
// Like / Unlike a post
router.post("/:id/like", protect, toggleLikePost);
module.exports = router;