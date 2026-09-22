const Community = require("../models/Community");
const Post = require("../models/Post");

/**
 * Get all communities with optional search and category filter
 */
const getCommunities = async (req, res) => {
  try {
    const { q, search, category } = req.query;
    const searchTerm = (search || q || "").trim();

    const query = {};

    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ];
    }

    if (category && category.toLowerCase() !== "all") {
      query.category = { $regex: `^${category}$`, $options: "i" };
    }

    const communities = await Community.find(query)
      .populate("createdBy", "name email role profilePicture college")
      .sort({ createdAt: -1 });

    const currentUserId = req.user?._id?.toString();

    const formattedCommunities = communities.map((comm) => {
      const commObj =
        typeof comm.toObject === "function" ? comm.toObject() : { ...comm };
      const members = Array.isArray(comm.members) ? comm.members : [];

      const isMember = Boolean(
        currentUserId &&
          members.some((m) => (m?._id || m)?.toString() === currentUserId)
      );

      return {
        ...commObj,
        membersCount: members.length,
        isMember,
      };
    });

    res.status(200).json({
      communities: formattedCommunities,
      total: formattedCommunities.length,
    });
  } catch (error) {
    console.error("Get Communities Error:", error);
    res.status(500).json({
      message: "Unable to fetch communities",
    });
  }
};

/**
 * Get details for a single community
 */
const getSingleCommunity = async (req, res) => {
  try {
    const { id } = req.params;

    const community = await Community.findById(id)
      .populate("createdBy", "name email role profilePicture college")
      .populate("members", "name email role profilePicture college");

    if (!community) {
      return res.status(404).json({
        message: "Community not found",
      });
    }

    const currentUserId = req.user?._id?.toString();
    const members = Array.isArray(community.members) ? community.members : [];
    const isMember = Boolean(
      currentUserId &&
        members.some((m) => (m?._id || m)?.toString() === currentUserId)
    );

    const commObj =
      typeof community.toObject === "function"
        ? community.toObject()
        : { ...community };

    res.status(200).json({
      community: {
        ...commObj,
        membersCount: members.length,
        isMember,
      },
      isMember,
      membersCount: members.length,
    });
  } catch (error) {
    console.error("Get Single Community Error:", error);
    res.status(500).json({
      message: "Unable to retrieve community details",
    });
  }
};

/**
 * Create a new community
 */
const createCommunity = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      type,
      college,
      branch,
      course,
      university,
      avatar,
      coverImage,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Community name is required",
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        message: "Description is required",
      });
    }

    const trimmedName = name.trim();

    // Check duplicate name
    const existing = await Community.findOne({
      name: { $regex: `^${trimmedName}$`, $options: "i" },
    });

    if (existing) {
      return res.status(400).json({
        message: "A community with this name already exists",
      });
    }

    const community = await Community.create({
      name: trimmedName,
      description: description.trim(),
      category: category || "General",
      type: type || "public",
      college: college || "",
      branch: branch || "",
      course: course || "",
      university: university || "",
      avatar: avatar || "",
      coverImage: coverImage || "",
      createdBy: req.user._id,
      members: [req.user._id],
    });

    await community.populate("createdBy", "name email role profilePicture college");

    res.status(201).json({
      message: "Community created successfully",
      community: {
        ...(typeof community.toObject === "function" ? community.toObject() : community),
        membersCount: 1,
        isMember: true,
      },
    });
  } catch (error) {
    console.error("Create Community Error:", error);
    res.status(500).json({
      message: "Server error while creating community",
    });
  }
};

/**
 * Join a community
 */
const joinCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const community = await Community.findById(id);

    if (!community) {
      return res.status(404).json({
        message: "Community not found",
      });
    }

    const userIdStr = req.user._id.toString();
    const members = community.members || [];
    const alreadyMember = members.some(
      (m) => (m?._id || m)?.toString() === userIdStr
    );

    if (alreadyMember) {
      return res.status(200).json({
        message: "Already a member of this community",
        community,
        isMember: true,
        membersCount: members.length,
      });
    }

    community.members.push(req.user._id);
    await community.save();

    res.status(200).json({
      message: "Joined community successfully",
      community,
      isMember: true,
      membersCount: community.members.length,
    });
  } catch (error) {
    console.error("Join Community Error:", error);
    res.status(500).json({
      message: "Unable to join community",
    });
  }
};

/**
 * Leave a community
 */
const leaveCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const community = await Community.findById(id);

    if (!community) {
      return res.status(404).json({
        message: "Community not found",
      });
    }

    const userIdStr = req.user._id.toString();
    const members = community.members || [];
    const isMember = members.some(
      (m) => (m?._id || m)?.toString() === userIdStr
    );

    if (!isMember) {
      return res.status(200).json({
        message: "Not a member of this community",
        community,
        isMember: false,
        membersCount: members.length,
      });
    }

    community.members = members.filter(
      (m) => (m?._id || m)?.toString() !== userIdStr
    );
    await community.save();

    res.status(200).json({
      message: "Left community successfully",
      community,
      isMember: false,
      membersCount: community.members.length,
    });
  } catch (error) {
    console.error("Leave Community Error:", error);
    res.status(500).json({
      message: "Unable to leave community",
    });
  }
};

/**
 * Get all posts belonging to a specific community
 */
const getCommunityPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const community = await Community.findById(id);

    if (!community) {
      return res.status(404).json({
        message: "Community not found",
      });
    }

    const posts = await Post.find({ community: id })
      .populate("author", "name email role profilePicture college")
      .sort({ createdAt: -1 });

    const currentUserId = req.user?._id?.toString();

    const postsWithStatus = posts.map((post) => {
      const postObj =
        typeof post.toObject === "function" ? post.toObject() : { ...post };

      return {
        ...postObj,
        likesCount: post.likes ? post.likes.length : 0,
        isLiked: Boolean(
          currentUserId &&
            post.likes &&
            post.likes.some((uId) => (uId?._id || uId)?.toString() === currentUserId)
        ),
        isSaved: Boolean(
          currentUserId &&
            post.savedBy &&
            post.savedBy.some((uId) => (uId?._id || uId)?.toString() === currentUserId)
        ),
      };
    });

    res.status(200).json({
      posts: postsWithStatus,
    });
  } catch (error) {
    console.error("Get Community Posts Error:", error);
    res.status(500).json({
      message: "Unable to retrieve community posts",
    });
  }
};

module.exports = {
  getCommunities,
  getSingleCommunity,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityPosts,
};
