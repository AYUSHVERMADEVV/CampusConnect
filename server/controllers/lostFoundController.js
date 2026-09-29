const LostFound = require("../models/LostFound");

// Get Lost & Found items with filtering & search
const getLostFoundItems = async (req, res) => {
  try {
    const { q, type, category, status, myListings } = req.query;
    const filter = {};

    // By default, only show active listings unless specifically asked for resolved or all
    if (status) {
      if (status !== "all") {
        filter.status = status;
      }
    } else if (myListings === "true") {
      // For personal listings, show both active and resolved unless filtered
    } else {
      filter.status = "active";
    }

    if (type && (type === "lost" || type === "found")) {
      filter.type = type;
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    if (myListings === "true" && req.user) {
      filter.postedBy = req.user._id;
    }

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), "i");
      filter.$or = [
        { title: { $regex: q.trim(), $options: "i" } },
        { description: { $regex: q.trim(), $options: "i" } },
        { location: { $regex: q.trim(), $options: "i" } },
        { category: { $regex: q.trim(), $options: "i" } },
        { brand: { $regex: q.trim(), $options: "i" } },
        { itemColor: { $regex: q.trim(), $options: "i" } },
      ];
    }

    const items = await LostFound.find(filter)
      .populate("postedBy", "name email role profilePicture avatar college branch course")
      .sort({ createdAt: -1 });

    res.status(200).json({
      items,
      total: items.length,
    });
  } catch (error) {
    console.error("Get Lost & Found Error:", error);
    res.status(500).json({
      message: "Unable to fetch Lost & Found items.",
    });
  }
};

// Get single Lost & Found item by ID
const getLostFoundById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LostFound.findById(id).populate(
      "postedBy",
      "name email role profilePicture avatar college branch course"
    );

    if (!item) {
      return res.status(404).json({
        message: "Lost & Found item not found.",
      });
    }

    res.status(200).json({
      item,
    });
  } catch (error) {
    console.error("Get Lost & Found By ID Error:", error);
    res.status(500).json({
      message: "Unable to fetch item details.",
    });
  }
};

// Create a new Lost & Found report
const createLostFoundItem = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      category,
      location,
      date,
      itemColor,
      brand,
      identifyingDetails,
      contactPreference,
      college,
      branch,
      course,
      university,
    } = req.body;

    if (!title?.trim() || !description?.trim() || !type || !category || !location?.trim() || !date) {
      return res.status(400).json({
        message: "Title, description, type, category, location, and date are required.",
      });
    }

    if (type !== "lost" && type !== "found") {
      return res.status(400).json({
        message: "Type must be either 'lost' or 'found'.",
      });
    }

    const imageUrl = req.file
      ? `/uploads/posts/${req.file.filename}`
      : req.body.image || "";

    const newItem = await LostFound.create({
      title: title.trim(),
      description: description.trim(),
      type,
      category,
      location: location.trim(),
      date: new Date(date),
      image: imageUrl,
      postedBy: req.user._id,
      status: "active",
      itemColor: (itemColor || "").trim(),
      brand: (brand || "").trim(),
      identifyingDetails: (identifyingDetails || "").trim(),
      contactPreference: (contactPreference || "chat").trim(),
      college: (college || req.user.college || "").trim(),
      branch: (branch || req.user.branch || "").trim(),
      course: (course || "").trim(),
      university: (university || "").trim(),
    });

    const populated = await LostFound.findById(newItem._id).populate(
      "postedBy",
      "name email role profilePicture avatar college branch course"
    );

    res.status(201).json({
      message: "Listing created successfully.",
      item: populated,
    });
  } catch (error) {
    console.error("Create Lost & Found Error:", error);
    res.status(500).json({
      message: "Unable to create Lost & Found report.",
    });
  }
};

// Update existing Lost & Found report
const updateLostFoundItem = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await LostFound.findById(id);

    if (!existing) {
      return res.status(404).json({
        message: "Item not found.",
      });
    }

    const posterId = (existing.postedBy?._id || existing.postedBy)?.toString();
    if (posterId !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized to edit this listing.",
      });
    }

    const updates = { ...req.body };
    if (req.file) {
      updates.image = `/uploads/posts/${req.file.filename}`;
    }
    if (updates.date) {
      updates.date = new Date(updates.date);
    }

    // Do not allow changing poster
    delete updates.postedBy;

    const updated = await LostFound.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("postedBy", "name email role profilePicture avatar college branch course");

    res.status(200).json({
      message: "Listing updated successfully.",
      item: updated,
    });
  } catch (error) {
    console.error("Update Lost & Found Error:", error);
    res.status(500).json({
      message: "Unable to update listing.",
    });
  }
};

// Resolve listing (mark as resolved / toggle)
const resolveLostFoundItem = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await LostFound.findById(id);

    if (!existing) {
      return res.status(404).json({
        message: "Item not found.",
      });
    }

    const posterId = (existing.postedBy?._id || existing.postedBy)?.toString();
    if (posterId !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized to resolve this listing.",
      });
    }

    const newStatus = req.body?.status || (existing.status === "resolved" ? "active" : "resolved");

    const updated = await LostFound.findByIdAndUpdate(
      id,
      { status: newStatus },
      { new: true }
    ).populate("postedBy", "name email role profilePicture avatar college branch course");

    res.status(200).json({
      message: `Listing marked as ${newStatus}.`,
      item: updated,
    });
  } catch (error) {
    console.error("Resolve Lost & Found Error:", error);
    res.status(500).json({
      message: "Unable to update listing status.",
    });
  }
};

// Delete listing
const deleteLostFoundItem = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await LostFound.findById(id);

    if (!existing) {
      return res.status(404).json({
        message: "Item not found.",
      });
    }

    const posterId = (existing.postedBy?._id || existing.postedBy)?.toString();
    if (posterId !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        message: "You are not authorized to delete this listing.",
      });
    }

    await LostFound.findByIdAndDelete(id);

    res.status(200).json({
      message: "Listing deleted successfully.",
      id,
    });
  } catch (error) {
    console.error("Delete Lost & Found Error:", error);
    res.status(500).json({
      message: "Unable to delete listing.",
    });
  }
};

module.exports = {
  getLostFoundItems,
  getLostFoundById,
  createLostFoundItem,
  updateLostFoundItem,
  resolveLostFoundItem,
  deleteLostFoundItem,
};
