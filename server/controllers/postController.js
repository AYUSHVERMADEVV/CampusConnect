const Post = require("../models/Post");
const Comment = require("../models/Comment");
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
      imageUrl: req.file ? `/uploads/posts/${req.file.filename}` : "",
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
const searchPosts = async (req, res) => {
  try {
    const query = req.query.q?.trim();

    if (!query) {
      return res.status(200).json({ posts: [] });
    }

    const posts = await Post.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { content: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ],
    })
      .populate("author", "name email role")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      posts,
    });
  } catch (error) {
    console.error("Search Posts Error:", error);

    res.status(500).json({
      message: "Unable to search posts.",
    });
  }
};
const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate("author", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const currentUserId = req.user?._id?.toString();

    const postsWithLikeStatus = posts.map((post) => {
      const postData = post.toObject();

      return {
  ...postData,
  likesCount: postData.likes.length,
  isLiked: currentUserId
    ? postData.likes.some((like) => like.toString() === currentUserId)
    : false,
  isSaved: currentUserId
    ? postData.savedBy?.some(
        (userId) => userId.toString() === currentUserId
      )
    : false,
};
    });

    const totalPosts = await Post.countDocuments();

    res.status(200).json({
      page,
      limit,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      posts: postsWithLikeStatus,
    });
  } catch (error) {
    console.error("Get Posts Error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};
const getSinglePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate("author", "name email role");

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    res.status(200).json({
      post,
    });
  } catch (error) {
    console.error("Get Single Post Error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const toggleLikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const userId = req.user._id.toString();

    const alreadyLiked = post.likes.some(
      (like) => like.toString() === userId
    );

    if (alreadyLiked) {
      // Unlike
      post.likes = post.likes.filter(
        (like) => like.toString() !== userId
      );
    } else {
      // Like
      post.likes.push(req.user._id);
    }

    await post.save();

    res.status(200).json({
      message: alreadyLiked
        ? "Post unliked successfully"
        : "Post liked successfully",
      likesCount: post.likes.length,
      isLiked: !alreadyLiked,
    });
  } catch (error) {
    console.error("Like Post Error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};
const toggleSavePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const userId = req.user._id;

    const alreadySaved = post.savedBy.some(
      (user) => user.toString() === userId.toString()
    );

    if (alreadySaved) {
      post.savedBy = post.savedBy.filter(
        (user) => user.toString() !== userId.toString()
      );
    } else {
      post.savedBy.push(userId);
    }

    await post.save();

    res.status(200).json({
      message: alreadySaved
        ? "Post removed from saved posts"
        : "Post saved successfully",
      isSaved: !alreadySaved,
      savedCount: post.savedBy.length,
    });
  } 
  catch (error) {
  console.error("SAVE ERROR:", error);
  console.error("STATUS:", error.response?.status);
  console.error("DATA:", error.response?.data);

  alert(
    error.response?.data?.message ||
    error.message ||
    "Unable to save post. Please try again."
  );
}
};
const getSavedPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      savedBy: req.user._id,
    })
      .populate("author", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      posts,
    });
  } catch (error) {
    console.error("Get Saved Posts Error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    // Only post author or admin can delete
    const isAuthor =
      post.author.toString() === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        message: "Not authorized to delete this post",
      });
    }

    await Post.findByIdAndDelete(id);

    // Delete all comments belonging to this post
    await Comment.deleteMany({ post: id });

    res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete Post Error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    // Only post author or admin can update
    const isAuthor =
      post.author.toString() === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        message: "Not authorized to update this post",
      });
    }

    // Update only provided fields
    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (category !== undefined) post.category = category;

    await post.save();

    await post.populate("author", "name email role");

    res.status(200).json({
      message: "Post updated successfully",
      post,
    });
  } catch (error) {
    console.error("Update Post Error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};
module.exports = {
  createPost,
  getPosts,
  getSinglePost,
  toggleLikePost,
  toggleSavePost,
  searchPosts,
  getSavedPosts,
  deletePost,
  updatePost,

};
