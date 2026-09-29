const express = require("express");
const {
  getCommunities,
  getSingleCommunity,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityPosts,
  deleteCommunity,
} = require("../controllers/communityController");
const { protect, optionalProtect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", optionalProtect, getCommunities);
router.post("/", protect, createCommunity);
router.get("/:id", optionalProtect, getSingleCommunity);
router.post("/:id/join", protect, joinCommunity);
router.post("/:id/leave", protect, leaveCommunity);
router.get("/:id/posts", optionalProtect, getCommunityPosts);
router.delete("/:id", protect, deleteCommunity);

module.exports = router;
