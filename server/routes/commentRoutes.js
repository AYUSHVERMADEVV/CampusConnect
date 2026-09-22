const express = require("express");

const {
  createComment,
  getComments,
  toggleLikeComment,
  deleteComment,
} = require("../controllers/commentController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Get all comments of a post
router.get("/:postId", getComments);

// Add comment to a post
router.post("/:postId", protect, createComment);

// Like / Unlike a comment
router.post("/:commentId/like", protect, toggleLikeComment);

// Delete a comment
router.delete("/:commentId", protect, deleteComment);

module.exports = router;