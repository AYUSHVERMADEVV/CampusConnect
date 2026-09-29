const express = require("express");
const {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  getAdminCommunities,
  getAdminEvents,
  getAdminPosts,
  getAdminLostFound,
} = require("../controllers/adminController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Enforce both JWT authentication and admin role verification on all admin routes
router.use(protect, requireAdmin);

// Dashboard statistics
router.get("/stats", getAdminStats);

// User management
router.get("/users", getAdminUsers);
router.patch("/users/:id/role", updateUserRole);

// Community management
router.get("/communities", getAdminCommunities);

// Event management
router.get("/events", getAdminEvents);

// Post moderation
router.get("/posts", getAdminPosts);

// Lost & Found moderation
router.get("/lost-found", getAdminLostFound);

module.exports = router;
