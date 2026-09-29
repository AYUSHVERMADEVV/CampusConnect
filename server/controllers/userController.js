const User = require("../models/User");
const bcrypt = require("bcryptjs");

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json({
      message: "Profile fetched successfully",
      user: user || req.user,
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
      .select("-password");

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

const updateProfile = async (req, res) => {
  try {
    const { name, username, bio, college, university, course, branch, year } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) user.name = name.trim();
    if (username !== undefined) user.username = username.trim().replace(/^@+/, "");
    if (bio !== undefined) user.bio = bio;
    if (college !== undefined) user.college = college.trim();
    if (university !== undefined) user.university = university.trim();
    if (course !== undefined) user.course = course.trim();
    if (branch !== undefined) user.branch = branch.trim();
    if (year !== undefined) user.year = year;

    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Unable to update profile" });
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please select an image to upload." });
    }

    const imageUrl = `/uploads/posts/${req.file.filename}`;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.profilePicture = imageUrl;
    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");

    res.status(200).json({
      message: "Profile picture updated successfully",
      profilePicture: imageUrl,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Upload Profile Picture Error:", error);
    res.status(500).json({ message: "Unable to upload profile picture" });
  }
};

const removeProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.profilePicture = "";
    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");

    res.status(200).json({
      message: "Profile picture removed",
      profilePicture: "",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Remove Profile Picture Error:", error);
    res.status(500).json({ message: "Unable to remove profile picture" });
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



const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long." });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ message: "Failed to change password. Please try again." });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found or already deleted." });
    }

    res.status(200).json({
      message: "Your account has been deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Account Error:", error);
    res.status(500).json({ message: "Failed to delete account. Please try again." });
  }
};

module.exports = {
  getMyProfile,
  searchUsers,
  getUserProfile,
  updateProfile,
  uploadProfilePicture,
  removeProfilePicture,
  changePassword,
  deleteAccount,
};