const Event = require("../models/Event");

const VALID_CATEGORIES = [
  "Hackathon",
  "Workshop",
  "Seminar",
  "Cultural",
  "Sports",
  "Club",
  "Placement",
  "Academic",
  "Fest",
  "Other",
];

/**
 * Get events with optional search, category, and time filtering
 */
const getEvents = async (req, res) => {
  try {
    const { q, search, category, timeFilter = "upcoming", date } = req.query;
    const searchTerm = (search || q || "").trim();

    const query = {};

    // Search query on title, description, and location
    if (searchTerm) {
      query.$or = [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { location: { $regex: searchTerm, $options: "i" } },
      ];
    }

    // Category filter
    if (category && category.toLowerCase() !== "all") {
      query.category = { $regex: `^${category}$`, $options: "i" };
    }

    // Specific date filter
    if (date) {
      const targetDate = new Date(date);
      if (!isNaN(targetDate.getTime())) {
        const startOfDay = new Date(targetDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        query.date = { $gte: startOfDay, $lt: endOfDay };
      }
    } else if (timeFilter === "upcoming") {
      // Show events from beginning of current day onwards
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.date = { $gte: today };
    } else if (timeFilter === "past") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.date = { $lt: today };
    }

    const sortOrder = timeFilter === "past" ? { date: -1 } : { date: 1 };

    const events = await Event.find(query)
      .populate("organizer", "name email role profilePicture college")
      .sort(sortOrder);

    const currentUserId = req.user?._id?.toString();

    const formattedEvents = events.map((ev) => {
      const eventObj = typeof ev.toObject === "function" ? ev.toObject() : { ...ev };
      const attendees = Array.isArray(ev.attendees) ? ev.attendees : [];

      const isAttending = Boolean(
        currentUserId &&
          attendees.some((a) => (a?._id || a)?.toString() === currentUserId)
      );

      const organizerId = (eventObj.organizer?._id || eventObj.organizer)?.toString();
      const isOrganizer = Boolean(currentUserId && organizerId === currentUserId);

      return {
        ...eventObj,
        attendeesCount: attendees.length,
        isAttending,
        isOrganizer,
      };
    });

    res.status(200).json({
      events: formattedEvents,
      total: formattedEvents.length,
    });
  } catch (error) {
    console.error("Get Events Error:", error);
    res.status(500).json({
      message: "Unable to fetch events",
    });
  }
};

/**
 * Get details for a single event
 */
const getSingleEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id)
      .populate("organizer", "name email role profilePicture college branch year")
      .populate("attendees", "name email role profilePicture college branch year");

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const currentUserId = req.user?._id?.toString();
    const attendees = Array.isArray(event.attendees) ? event.attendees : [];

    const isAttending = Boolean(
      currentUserId &&
        attendees.some((a) => (a?._id || a)?.toString() === currentUserId)
    );

    const eventObj =
      typeof event.toObject === "function" ? event.toObject() : { ...event };
    const organizerId = (eventObj.organizer?._id || eventObj.organizer)?.toString();
    const isOrganizer = Boolean(currentUserId && organizerId === currentUserId);

    res.status(200).json({
      event: {
        ...eventObj,
        attendeesCount: attendees.length,
        isAttending,
        isOrganizer,
      },
      isAttending,
      attendeesCount: attendees.length,
      isOrganizer,
    });
  } catch (error) {
    console.error("Get Single Event Error:", error);
    res.status(500).json({
      message: "Unable to fetch event details",
    });
  }
};

/**
 * Create a new event
 */
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      category,
      capacity,
      registrationRequired,
      college,
      branch,
      course,
      university,
    } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Event title is required." });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ message: "Event description is required." });
    }

    if (!date) {
      return res.status(400).json({ message: "Event date is required." });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Please provide a valid date." });
    }

    if (!startTime || !startTime.trim()) {
      return res.status(400).json({ message: "Event start time is required." });
    }

    if (!location || !location.trim()) {
      return res.status(400).json({ message: "Event location is required." });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({ message: "Event category is required." });
    }

    const matchedCategory = VALID_CATEGORIES.find(
      (c) => c.toLowerCase() === category.trim().toLowerCase()
    );

    if (!matchedCategory) {
      return res.status(400).json({
        message: `Category must be one of: ${VALID_CATEGORIES.join(", ")}`,
      });
    }

    let parsedCapacity = null;
    if (capacity !== undefined && capacity !== null && capacity !== "") {
      const num = parseInt(capacity, 10);
      if (isNaN(num) || num <= 0) {
        return res.status(400).json({ message: "Capacity must be a positive number." });
      }
      parsedCapacity = num;
    }

    // Image handling
    let imageUrl = "";
    if (req.file) {
      imageUrl = `/uploads/posts/${req.file.filename}`;
    } else if (req.body.image && typeof req.body.image === "string") {
      imageUrl = req.body.image.trim();
    }

    const eventData = {
      title: title.trim(),
      description: description.trim(),
      date: parsedDate,
      startTime: startTime.trim(),
      endTime: endTime ? endTime.trim() : "",
      location: location.trim(),
      category: matchedCategory,
      organizer: req.user._id,
      attendees: [req.user._id], // Creator automatically RSVPs as first attendee
      capacity: parsedCapacity,
      registrationRequired: Boolean(registrationRequired),
      image: imageUrl,
      college: (college || req.user.college || "").trim(),
      branch: (branch || req.user.branch || "").trim(),
      course: (course || "").trim(),
      university: (university || "").trim(),
    };

    const newEvent = await Event.create(eventData);

    const populatedEvent = await Event.findById(newEvent._id)
      .populate("organizer", "name email role profilePicture college")
      .populate("attendees", "name email role profilePicture college");

    const eventObj =
      typeof populatedEvent?.toObject === "function"
        ? populatedEvent.toObject()
        : { ...(populatedEvent || newEvent) };

    res.status(201).json({
      message: "Event created successfully",
      event: {
        ...eventObj,
        attendeesCount: Array.isArray(eventObj.attendees) ? eventObj.attendees.length : 1,
        isAttending: true,
        isOrganizer: true,
      },
    });
  } catch (error) {
    console.error("Create Event Error:", error);
    res.status(500).json({
      message: "Failed to create event. Please try again.",
    });
  }
};

/**
 * RSVP / Attend an event
 */
const rsvpEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // Check if event has already passed (more than 1 day ago)
    const eventDate = new Date(event.date);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (eventDate < oneDayAgo) {
      return res.status(400).json({
        message: "Cannot RSVP to an event that has already taken place",
      });
    }

    const attendees = Array.isArray(event.attendees) ? event.attendees : [];
    const isAlreadyAttending = attendees.some(
      (a) => (a?._id || a)?.toString() === userId.toString()
    );

    if (isAlreadyAttending) {
      return res.status(400).json({
        message: "You have already RSVP'd to this event",
      });
    }

    // Capacity check
    if (event.capacity && attendees.length >= event.capacity) {
      return res.status(400).json({
        message: "This event has reached maximum attendee capacity",
      });
    }

    event.attendees.push(userId);
    await event.save();

    res.status(200).json({
      message: "RSVP successful! You are now attending this event.",
      isAttending: true,
      attendeesCount: event.attendees.length,
      event,
    });
  } catch (error) {
    console.error("RSVP Event Error:", error);
    res.status(500).json({
      message: "Unable to complete RSVP",
    });
  }
};

/**
 * Cancel RSVP for an event
 */
const cancelRsvpEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const attendees = Array.isArray(event.attendees) ? event.attendees : [];
    const isAttending = attendees.some(
      (a) => (a?._id || a)?.toString() === userId.toString()
    );

    if (!isAttending) {
      return res.status(400).json({
        message: "You have not RSVP'd to this event",
      });
    }

    event.attendees = attendees.filter(
      (a) => (a?._id || a)?.toString() !== userId.toString()
    );
    await event.save();

    res.status(200).json({
      message: "RSVP cancelled successfully",
      isAttending: false,
      attendeesCount: event.attendees.length,
      event,
    });
  } catch (error) {
    console.error("Cancel RSVP Error:", error);
    res.status(500).json({
      message: "Unable to cancel RSVP",
    });
  }
};

/**
 * Get all attendees of an event
 */
const getEventAttendees = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id).populate(
      "attendees",
      "name email role profilePicture college branch year"
    );

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const attendees = Array.isArray(event.attendees) ? event.attendees : [];

    res.status(200).json({
      attendees,
      total: attendees.length,
    });
  } catch (error) {
    console.error("Get Event Attendees Error:", error);
    res.status(500).json({
      message: "Unable to fetch attendees",
    });
  }
};

/**
 * Delete an event (organizer only)
 */
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const organizerId = (event.organizer?._id || event.organizer)?.toString();

    if (organizerId !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        message: "You are not authorized to delete this event. Only the organizer can delete it.",
      });
    }

    await Event.findByIdAndDelete(id);

    res.status(200).json({
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Delete Event Error:", error);
    res.status(500).json({
      message: "Unable to delete event",
    });
  }
};

module.exports = {
  getEvents,
  getSingleEvent,
  createEvent,
  rsvpEvent,
  cancelRsvpEvent,
  getEventAttendees,
  deleteEvent,
};
