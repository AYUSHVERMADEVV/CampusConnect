const Message = require("../models/Message");
const { createNotification } = require("./notificationController");

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

    createNotification({
      recipient: receiver,
      sender: req.user._id,
      type: "message",
      message: message._id,
    }).catch((err) => console.error("Notification message error:", err.message));

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
    const currentUserId = req.user._id.toString();

    // Mark incoming unread messages from this partner as read
    try {
      await Message.updateMany(
        {
          receiver: currentUserId,
          sender: userId,
          isRead: false,
        },
        {
          $set: { isRead: true },
        }
      );
    } catch (readErr) {
      console.warn("Could not mark messages as read in getConversation:", readErr.message);
    }

    const messages = await Message.find({
      $or: [
        {
          sender: currentUserId,
          receiver: userId,
        },
        {
          sender: userId,
          receiver: currentUserId,
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

// Mark incoming unread messages from a conversation partner as read
const markConversationAsRead = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();
    const { userId: partnerId } = req.params;

    if (!partnerId) {
      return res.status(400).json({
        message: "Conversation partner userId is required.",
      });
    }

    const result = await Message.updateMany(
      {
        receiver: currentUserId,
        sender: partnerId,
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    res.status(200).json({
      success: true,
      message: "Messages marked as read successfully.",
      modifiedCount: result?.modifiedCount || result?.nModified || 0,
    });
  } catch (error) {
    console.error("Mark Messages Read Error:", error);
    res.status(500).json({
      message: "Unable to mark messages as read.",
    });
  }
};

// Get all conversations for the logged-in user
const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();

    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    })
      .populate("sender", "name email role profilePicture avatar college branch")
      .populate("receiver", "name email role profilePicture avatar college branch")
      .sort({ createdAt: -1 });

    const conversationMap = new Map();

    for (const msg of messages) {
      const senderId = (msg.sender?._id || msg.sender)?.toString();
      const receiverId = (msg.receiver?._id || msg.receiver)?.toString();
      const isSender = senderId === currentUserId;
      const otherUserId = isSender ? receiverId : senderId;

      if (!otherUserId || otherUserId === currentUserId) continue;

      if (!conversationMap.has(otherUserId)) {
        const otherUser = isSender ? msg.receiver : msg.sender;
        conversationMap.set(otherUserId, {
          user:
            otherUser && typeof otherUser === "object"
              ? otherUser
              : { _id: otherUserId, name: "Campus Student" },
          lastMessage: {
            _id: msg._id,
            content: msg.content,
            createdAt: msg.createdAt,
            sender: senderId,
            receiver: receiverId,
            isRead: Boolean(msg.isRead),
          },
          unreadCount: !isSender && !msg.isRead ? 1 : 0,
        });
      } else {
        const conv = conversationMap.get(otherUserId);
        const otherUser = isSender ? msg.receiver : msg.sender;
        if (
          (!conv.user?.name || conv.user.name === "Campus Student") &&
          otherUser &&
          typeof otherUser === "object" &&
          otherUser.name
        ) {
          conv.user = otherUser;
        }
        if (!isSender && !msg.isRead) {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
        }
      }
    }

    const conversations = Array.from(conversationMap.values());

    res.status(200).json({
      conversations,
    });
  } catch (error) {
    console.error("Get Conversations Error:", error);
    res.status(500).json({
      message: "Unable to fetch conversations.",
    });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  markConversationAsRead,
  getConversations,
};