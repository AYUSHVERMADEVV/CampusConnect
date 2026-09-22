const Comment = require("../models/Comment");
const Post = require("../models/Post");

const createComment = async (req, res) => {
  try {
    const { content, parentComment } = req.body;
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
  parentComment: parentComment || null,
});

    await comment.populate("author", "name email role");

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
  .populate("parentComment")
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

/* ================================
   LIKE / UNLIKE COMMENT
================================ */

const toggleLikeComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    const userId = req.user._id.toString();

    const alreadyLiked = comment.likes.some(
      (like) => like.toString() === userId
    );

    if (alreadyLiked) {
      // Unlike
      comment.likes = comment.likes.filter(
        (like) => like.toString() !== userId
      );
    } else {
      // Like
      comment.likes.push(req.user._id);
    }

    await comment.save();

    res.status(200).json({
      message: alreadyLiked
        ? "Comment unliked successfully"
        : "Comment liked successfully",
      isLiked: !alreadyLiked,
      likesCount: comment.likes.length,
    });
  } catch (error) {
    console.error("Like Comment Error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to delete this comment",
      });
    }

    await Comment.findByIdAndDelete(commentId);

    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentsCount: -1 },
    });

    res.status(200).json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete Comment Error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createComment,
  getComments,
  toggleLikeComment,
  deleteComment,
};