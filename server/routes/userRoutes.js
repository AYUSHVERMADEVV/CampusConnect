const express = require("express");
const { getMyProfile } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/profile", protect, getMyProfile);

module.exports = router;