const express = require("express");
const router = express.Router();

const {
  sendMessage,
  getConversation,
} = require("../controllers/messageController");

const {protect} = require("../middleware/authMiddleware");

// Send message
router.post("/", protect, sendMessage);

// Get conversation with another user
router.get("/:userId", protect, getConversation);

module.exports = router;