const express = require("express");
const {
  getEvents,
  getSingleEvent,
  createEvent,
  rsvpEvent,
  cancelRsvpEvent,
  getEventAttendees,
  deleteEvent,
} = require("../controllers/eventController");
const { protect, optionalProtect } = require("../middleware/authMiddleware");
const { uploadPostImage } = require("../middleware/uploadMiddleware");

const router = express.Router();

// List events with search and filters
router.get("/", optionalProtect, getEvents);

// Create a new event (with optional image upload)
router.post("/", protect, uploadPostImage.single("image"), createEvent);

// Get single event details
router.get("/:id", optionalProtect, getSingleEvent);

// RSVP / Attend event
router.post("/:id/rsvp", protect, rsvpEvent);

// Cancel RSVP
router.post("/:id/cancel-rsvp", protect, cancelRsvpEvent);

// Get event attendees
router.get("/:id/attendees", optionalProtect, getEventAttendees);

// Delete event (organizer only)
router.delete("/:id", protect, deleteEvent);

module.exports = router;
