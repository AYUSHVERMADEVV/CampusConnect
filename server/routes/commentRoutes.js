const express = require("express");
const {
  createComment,
  getComments,
  deleteComment
} = require("../controllers/commentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Add comment to a post
router.get("/:postId", getComments);
router.post("/:postId", protect, createComment);
// Delete a comment
router.delete("/:commentId", protect, deleteComment);


module.exports = router;