const express = require("express");
const { createComment } = require("../controllers/commentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Add comment to a post
router.post("/:postId", protect, createComment);

module.exports = router;