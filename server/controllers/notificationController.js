const Notification = require("../models/Notification");

/**
 * Helper to safely create notifications with duplicate prevention and self-action filter.
 */
const createNotification = async ({
  recipient,
  sender,
  type,
  post = null,
  comment = null,
  community = null,
  event = null,
  message = null,
}) => {
  try {
    if (!recipient || !sender) return null;

    const recipientId = (recipient?._id || recipient).toString();
    const senderId = (sender?._id || sender).toString();

    // Do NOT notify yourself
    if (recipientId === senderId) {
      return null;
    }

    // Deduplication checks
    if (type === "like" && post) {
      const postId = (post?._id || post).toString();
      const existingLike = await Notification.findOne({
        recipient: recipientId,
        sender: senderId,
        type: "like",
        post: postId,
      });
      if (existingLike) {
        return existingLike;
      }
    }

    if (type === "community" && community) {
      const commId = (community?._id || community).toString();
      const existingComm = await Notification.findOne({
        recipient: recipientId,
        sender: senderId,
        type: "community",
        community: commId,
      });
      if (existingComm) {
        return existingComm;
      }
    }

    if (type === "event" && event) {
      const eventId = (event?._id || event).toString();
      const existingEvent = await Notification.findOne({
        recipient: recipientId,
        sender: senderId,
        type: "event",
        event: eventId,
      });
      if (existingEvent) {
        return existingEvent;
      }
    }

    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      post: post ? (post?._id || post).toString() : null,
      comment: comment ? (comment?._id || comment).toString() : null,
      community: community ? (community?._id || community).toString() : null,
      event: event ? (event?._id || event).toString() : null,
      message: message ? (message?._id || message).toString() : null,
      read: false,
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error.message);
    return null;
  }
};

/**
 * GET /api/notifications
 * Returns notifications belonging ONLY to authenticated user.
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id?.toString();
    if (!userId) {
      return res.status(200).json({ notifications: [], total: 0, unreadCount: 0, page: 1, limit: 20 });
    }
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = { recipient: userId };

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    const notifications = await Notification.find(query)
      .populate("sender", "name email role profilePicture avatar college branch")
      .populate("post", "title content image category")
      .populate("comment", "content")
      .populate("community", "name avatar")
      .populate("event", "title date location image")
      .populate("message", "content")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      notifications: notifications || [],
      total: total || 0,
      unreadCount: unreadCount || 0,
      page,
      limit,
    });
  } catch (error) {
    console.warn("Get Notifications Warning:", error.message);
    res.status(200).json({
      notifications: [],
      total: 0,
      unreadCount: 0,
      page: 1,
      limit: 20,
    });
  }
};

/**
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id?.toString();
    if (!userId) {
      return res.status(200).json({ unreadCount: 0 });
    }
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    res.status(200).json({
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.warn("Get Unread Count Warning:", error.message);
    res.status(200).json({
      unreadCount: 0,
    });
  }
};

/**
 * PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    const recipientId = (notification.recipient?._id || notification.recipient)?.toString();
    if (recipientId !== userId) {
      return res.status(403).json({
        message: "Not authorized to modify this notification",
      });
    }

    const updated = await Notification.findByIdAndUpdate(
      id,
      { $set: { read: true } },
      { new: true }
    )
      .populate("sender", "name email role profilePicture avatar college branch")
      .populate("post", "title content image category")
      .populate("comment", "content")
      .populate("community", "name avatar")
      .populate("event", "title date location image")
      .populate("message", "content");

    res.status(200).json({
      message: "Notification marked as read",
      notification: updated,
    });
  } catch (error) {
    console.error("Mark Notification Read Error:", error);
    res.status(500).json({
      message: "Unable to update notification",
    });
  }
};

/**
 * PATCH /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    await Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark All Read Error:", error);
    res.status(500).json({
      message: "Unable to mark notifications as read",
    });
  }
};

/**
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    const recipientId = (notification.recipient?._id || notification.recipient)?.toString();
    if (recipientId !== userId) {
      return res.status(403).json({
        message: "Not authorized to delete this notification",
      });
    }

    await Notification.findByIdAndDelete(id);

    res.status(200).json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete Notification Error:", error);
    res.status(500).json({
      message: "Unable to delete notification",
    });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
