const express = require("express");
const {
  getLostFoundItems,
  getLostFoundById,
  createLostFoundItem,
  updateLostFoundItem,
  resolveLostFoundItem,
  deleteLostFoundItem,
} = require("../controllers/lostFoundController");
const { protect, optionalProtect } = require("../middleware/authMiddleware");
const { uploadPostImage } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", optionalProtect, getLostFoundItems);
router.get("/:id", optionalProtect, getLostFoundById);
router.post("/", protect, uploadPostImage.single("image"), createLostFoundItem);
router.put("/:id", protect, uploadPostImage.single("image"), updateLostFoundItem);
router.patch("/:id/resolve", protect, resolveLostFoundItem);
router.delete("/:id", protect, deleteLostFoundItem);

module.exports = router;
