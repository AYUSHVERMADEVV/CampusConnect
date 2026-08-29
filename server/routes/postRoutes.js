
const express = require("express");
const {
  createPost,
  getPosts,
  toggleLikePost,
  deletePost,
  updatePost
} = require("../controllers/postController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Create a new post
router.get("/", getPosts);
router.post("/", protect, createPost);
// Like / Unlike a post
router.post("/:id/like", protect, toggleLikePost);

// Update a post
router.put("/:id", protect, updatePost);
// Delete a post
router.delete("/:id", protect, deletePost);
module.exports = router;