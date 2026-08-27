const express = require("express");
const { getMyProfile } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const router = express.Router();

router.get("/profile", protect, getMyProfile);
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
module.exports = router;