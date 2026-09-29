const express = require("express");
const {
  getMyProfile,
  searchUsers,
  getUserProfile,
  updateProfile,
  uploadProfilePicture,
  removeProfilePicture,
  changePassword,
  deleteAccount,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { uploadPostImage } = require("../middleware/uploadMiddleware");
const router = express.Router();

router.get("/profile", protect, getMyProfile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.delete("/account", protect, deleteAccount);
router.post(
  "/profile/picture",
  protect,
  uploadPostImage.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  (req, res, next) => {
    if (req.files) {
      if (req.files.profilePicture?.[0]) {
        req.file = req.files.profilePicture[0];
      } else if (req.files.image?.[0]) {
        req.file = req.files.image[0];
      }
    }
    next();
  },
  uploadProfilePicture
);
router.delete("/profile/picture", protect, removeProfilePicture);
router.get("/search", protect, searchUsers);

router.get(
  "/admin-test",
  protect,
  authorizeRoles("admin"),
  (req, res) => {
    res.status(200).json({
      message: "Welcome Admin! You have access.",
      user: req.user,
    });
  }
);
router.get("/:id", protect, getUserProfile);
module.exports = router;