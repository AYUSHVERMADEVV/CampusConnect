const Post = require("../models/Post");

const createPost = async (req, res) => {
  try {
    const { title, content, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: "Title and content are required",
      });
    }

    const post = await Post.create({
      title,
      content,
      category: category || "general",
      author: req.user._id,
    });

    await post.populate("author", "name email role");

    res.status(201).json({
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error("Create Post Error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: posts.length,
      posts,
    });
  } catch (error) {
    console.error("Get Posts Error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createPost,
  getPosts,
};