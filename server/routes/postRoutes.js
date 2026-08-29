
const express = require("express");
const {
  createPost,
  getPosts,
  toggleLikePost,
  deletePost
} = require("../controllers/postController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Create a new post
router.get("/", getPosts);
router.post("/", protect, createPost);
// Like / Unlike a post
router.post("/:id/like", protect, toggleLikePost);
// Delete a post
router.delete("/:id", protect, deletePost);


module.exports = router;