
const express = require("express");
const {
  createPost,
  getPosts,
  getSinglePost,
  toggleLikePost,
  deletePost,
  updatePost
} = require("../controllers/postController");
const { protect, optionalProtect } = require("../middleware/authMiddleware");
const { uploadPostImage } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Create a new post
router.get("/", optionalProtect, getPosts);
// Get single post
router.get("/:id", getSinglePost);
router.post("/", protect, uploadPostImage.single("image"), createPost);
// Like / Unlike a post
router.post("/:id/like", protect, toggleLikePost);

// Update a post
router.put("/:id", protect, updatePost);
// Delete a post
router.delete("/:id", protect, deletePost);
module.exports = router;
