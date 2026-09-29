const express = require("express");
const router = express.Router();

const {
  sendMessage,
  getConversation,
  markConversationAsRead,
  getConversations,
} = require("../controllers/messageController");

const {protect} = require("../middleware/authMiddleware");

// Get all conversations for current user
router.get("/", protect, getConversations);

// Send message
router.post("/", protect, sendMessage);

// Get conversation with another user
router.get("/:userId", protect, getConversation);

// Mark conversation with another user as read
router.patch("/:userId/read", protect, markConversationAsRead);

module.exports = router;