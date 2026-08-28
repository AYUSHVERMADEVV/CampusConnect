const Comment = require("../models/Comment");
const Post = require("../models/Post");

const createComment = async (req, res) => {
  try {
    const { content } = req.body;
    const { postId } = req.params;

    if (!content) {
      return res.status(400).json({
        message: "Comment content is required",
      });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const comment = await Comment.create({
      content,
      author: req.user._id,
      post: postId,
    });

    await comment.populate("author", "name email role");

    // Update comment count on post
    post.commentsCount += 1;
    await post.save();

    res.status(201).json({
      message: "Comment added successfully",
      comment,
    });
  } catch (error) {
    console.error("Create Comment Error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ post: postId })
      .populate("author", "name email role")
      .sort({ createdAt: 1 });

    res.status(200).json({
      count: comments.length,
      comments,
    });
  } catch (error) {
    console.error("Get Comments Error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createComment,
  getComments,
};