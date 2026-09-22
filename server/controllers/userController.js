const User = require("../models/User");

const getMyProfile = async (req, res) => {
  try {
    res.status(200).json({
      message: "Profile fetched successfully",
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("name email role college branch year");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get User Profile Error:", error);

    res.status(500).json({
      message: "Unable to fetch user profile.",
    });
  }
};


const searchUsers = async (req, res) => {
  try {
    const query = req.query.q?.trim();

    if (!query) {
      return res.status(200).json({ users: [] });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    })
      .select("name email role college branch year")
      .limit(20);

    res.status(200).json({ users });
  } catch (error) {
    console.error("Search Users Error:", error);
    res.status(500).json({
      message: "Unable to search users.",
    });
  }
};



module.exports = {
  getMyProfile,
  searchUsers,
  getUserProfile,
};