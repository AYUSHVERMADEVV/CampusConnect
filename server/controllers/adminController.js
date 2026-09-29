const User = require("../models/User");
const Community = require("../models/Community");
const Event = require("../models/Event");
const Post = require("../models/Post");
const LostFound = require("../models/LostFound");

/**
 * GET /api/admin/stats
 * Real database counts for platform overview
 */
const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCommunities,
      totalEvents,
      totalPosts,
      totalLostFound,
      studentsCount,
      clubAdminsCount,
      adminsCount,
    ] = await Promise.all([
      User.countDocuments(),
      Community.countDocuments(),
      Event.countDocuments(),
      Post.countDocuments(),
      LostFound.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "club_admin" }),
      User.countDocuments({ role: "admin" }),
    ]);

    res.status(200).json({
      totalUsers,
      totalCommunities,
      totalEvents,
      totalPosts,
      totalLostFound,
      roleBreakdown: {
        students: studentsCount,
        clubAdmins: clubAdminsCount,
        admins: adminsCount,
      },
    });
  } catch (error) {
    console.error("Admin Stats Error:", error.message);
    res.status(500).json({ message: "Failed to fetch admin stats" });
  }
};

/**
 * GET /api/admin/users
 * Paginated user listing with search and role filter
 */
const getAdminUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const role = (req.query.role || "").trim();
    const search = (req.query.search || "").trim();

    const query = {};

    if (role && ["student", "club_admin", "admin"].includes(role)) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { college: { $regex: search, $options: "i" } },
      ];
    }

    const [total, rawUsers] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    // Ensure password hash is never included in response
    const users = rawUsers.map((u) => {
      const obj = typeof u.toObject === "function" ? u.toObject() : { ...u };
      delete obj.password;
      return obj;
    });

    res.status(200).json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error("Admin Get Users Error:", error.message);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

/**
 * PATCH /api/admin/users/:id/role
 * Admin-only role modification with safety checks
 */
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const ALLOWED_ROLES = ["student", "club_admin", "admin"];
    if (!role || !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        message: `Invalid role specified. Allowed roles are: ${ALLOWED_ROLES.join(", ")}`,
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentAdminId = (req.user._id || req.user.id).toString();
    const targetUserId = (targetUser._id || targetUser.id).toString();

    // Prevent admin from demoting themselves to avoid lockout
    if (currentAdminId === targetUserId && role !== "admin") {
      return res.status(400).json({
        message: "Administrators cannot demote their own account to prevent accidental lockout.",
      });
    }

    // Prevent demoting the last remaining administrator
    if (targetUser.role === "admin" && role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          message: "Cannot demote the only remaining administrator on the platform.",
        });
      }
    }

    targetUser.role = role;
    if (typeof targetUser.save === "function") {
      await targetUser.save();
    } else if (User.findByIdAndUpdate) {
      await User.findByIdAndUpdate(targetUserId, { role });
    }

    res.status(200).json({
      message: "User role updated successfully",
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error) {
    console.error("Admin Update Role Error:", error.message);
    res.status(500).json({ message: "Failed to update user role" });
  }
};

/**
 * GET /api/admin/communities
 * Paginated community listing for admin management
 */
const getAdminCommunities = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const search = (req.query.search || "").trim();

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const [total, communities] = await Promise.all([
      Community.countDocuments(query),
      Community.find(query)
        .populate("createdBy", "name email role profilePicture avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    const formatted = communities.map((comm) => {
      const obj = typeof comm.toObject === "function" ? comm.toObject() : { ...comm };
      return {
        ...obj,
        membersCount: Array.isArray(obj.members) ? obj.members.length : 0,
      };
    });

    res.status(200).json({
      communities: formatted,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error("Admin Get Communities Error:", error.message);
    res.status(500).json({ message: "Failed to fetch communities" });
  }
};

/**
 * GET /api/admin/events
 * Paginated event listing for admin management
 */
const getAdminEvents = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const search = (req.query.search || "").trim();

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const [total, events] = await Promise.all([
      Event.countDocuments(query),
      Event.find(query)
        .populate("organizer", "name email role profilePicture avatar college branch")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    const formatted = events.map((ev) => {
      const obj = typeof ev.toObject === "function" ? ev.toObject() : { ...ev };
      return {
        ...obj,
        attendeesCount: Array.isArray(obj.attendees) ? obj.attendees.length : 0,
      };
    });

    res.status(200).json({
      events: formatted,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error("Admin Get Events Error:", error.message);
    res.status(500).json({ message: "Failed to fetch events" });
  }
};

/**
 * GET /api/admin/posts
 * Paginated post listing for admin moderation
 */
const getAdminPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const search = (req.query.search || "").trim();

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const [total, posts] = await Promise.all([
      Post.countDocuments(query),
      Post.find(query)
        .populate("author", "name email role profilePicture avatar college")
        .populate("community", "name category")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    const formatted = posts.map((p) => {
      const obj = typeof p.toObject === "function" ? p.toObject() : { ...p };
      return {
        ...obj,
        likesCount: Array.isArray(obj.likes) ? obj.likes.length : 0,
      };
    });

    res.status(200).json({
      posts: formatted,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error("Admin Get Posts Error:", error.message);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

/**
 * GET /api/admin/lost-found
 * Paginated lost & found listing for admin moderation
 */
const getAdminLostFound = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const search = (req.query.search || "").trim();

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const [total, items] = await Promise.all([
      LostFound.countDocuments(query),
      LostFound.find(query)
        .populate("postedBy", "name email role profilePicture avatar college branch")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    res.status(200).json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error("Admin Get Lost & Found Error:", error.message);
    res.status(500).json({ message: "Failed to fetch lost & found listings" });
  }
};

module.exports = {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  getAdminCommunities,
  getAdminEvents,
  getAdminPosts,
  getAdminLostFound,
};
