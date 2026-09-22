const Message = require("../models/Message");

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { receiver, content } = req.body;

    if (!receiver || !content?.trim()) {
      return res.status(400).json({
        message: "Receiver and message content are required.",
      });
    }

    if (receiver === req.user._id.toString()) {
      return res.status(400).json({
        message: "You cannot send a message to yourself.",
      });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver,
      content: content.trim(),
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name email role")
      .populate("receiver", "name email role");

    res.status(201).json({
      message: "Message sent successfully.",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({
      message: "Unable to send message.",
    });
  }
};

// Get conversation between logged-in user and another user
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [
        {
          sender: req.user._id,
          receiver: userId,
        },
        {
          sender: userId,
          receiver: req.user._id,
        },
      ],
    })
      .populate("sender", "name email role")
      .populate("receiver", "name email role")
      .sort({ createdAt: 1 });

    res.status(200).json({
      messages,
    });
  } catch (error) {
    console.error("Get Conversation Error:", error);
    res.status(500).json({
      message: "Unable to fetch conversation.",
    });
  }
};

module.exports = {
  sendMessage,
  getConversation,
};