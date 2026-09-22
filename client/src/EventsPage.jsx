import { useState, useEffect, useCallback, useRef } from "react";
import API from "./api";
import "./events.css";

const CATEGORIES = [
  "All",
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

const CATEGORY_ICONS = {
  Hackathon: "⚡",
  Workshop: "🛠️",
  Seminar: "🎓",
  Cultural: "🎭",
  Sports: "🏆",
  Club: "👥",
  Placement: "💼",
  Academic: "📚",
  Fest: "🎉",
  Other: "📌",
};

// Date formatter helper
function formatEventDate(dateString) {
  if (!dateString) return { formatted: "", month: "", day: "", weekday: "" };
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return { formatted: dateString, month: "", day: "", weekday: "" };

  const month = d.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  const day = d.getDate();
  const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
  const formatted = d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return { formatted, month, day, weekday };
}

export default function EventsPage({ currentUser, onAuthorClick, onBack }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [timeFilter, setTimeFilter] = useState("upcoming"); // 'upcoming' | 'past'

  // Selected event for detail view
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [eventDetail, setEventDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpError, setRsvpError] = useState("");

  // Create Event Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fileInputRef = useRef(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    category: "Hackathon",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    capacity: "",
    registrationRequired: false,
    college: currentUser?.college || "",
    branch: currentUser?.branch || "",
    imageFile: null,
    imagePreview: "",
  });

  // Fetch events list
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        timeFilter,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (selectedCategory && selectedCategory !== "All") {
        params.category = selectedCategory;
      }

      const res = await API.get("/events", { params });
      setEvents(res.data.events || []);
    } catch (err) {
      console.error("Failed to load events:", err);
      setError(err.response?.data?.message || "Failed to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, timeFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Fetch single event details
  const fetchEventDetail = useCallback(async (id) => {
    try {
      setDetailLoading(true);
      setRsvpError("");
      const res = await API.get(`/events/${id}`);
      setEventDetail(res.data.event);
    } catch (err) {
      console.error("Failed to load event details:", err);
      setRsvpError(err.response?.data?.message || "Could not load event details.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openEventDetail = (id) => {
    setSelectedEventId(id);
    fetchEventDetail(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeEventDetail = () => {
    setSelectedEventId(null);
    setEventDetail(null);
    fetchEvents();
  };

  // RSVP / Join
  const handleRsvp = async (eventId, e) => {
    if (e) e.stopPropagation();
    try {
      setRsvpLoading(true);
      setRsvpError("");

      const res = await API.post(`/events/${eventId}/rsvp`);

      // Update in detail view if open
      if (eventDetail && eventDetail._id === eventId) {
        setEventDetail((prev) => ({
          ...prev,
          isAttending: true,
          attendeesCount: res.data.attendeesCount,
          attendees: [
            ...(prev.attendees || []),
            currentUser
              ? {
                  _id: currentUser._id,
                  name: currentUser.name,
                  email: currentUser.email,
                  college: currentUser.college,
                  branch: currentUser.branch,
                  role: currentUser.role,
                }
              : {},
          ],
        }));
      }

      // Update in list
      setEvents((prev) =>
        prev.map((ev) =>
          ev._id === eventId
            ? { ...ev, isAttending: true, attendeesCount: res.data.attendeesCount }
            : ev
        )
      );
    } catch (err) {
      setRsvpError(err.response?.data?.message || "Unable to RSVP. Please try again.");
    } finally {
      setRsvpLoading(false);
    }
  };

  // Cancel RSVP
  const handleCancelRsvp = async (eventId, e) => {
    if (e) e.stopPropagation();
    try {
      setRsvpLoading(true);
      setRsvpError("");

      const res = await API.post(`/events/${eventId}/cancel-rsvp`);

      if (eventDetail && eventDetail._id === eventId) {
        setEventDetail((prev) => ({
          ...prev,
          isAttending: false,
          attendeesCount: res.data.attendeesCount,
          attendees: (prev.attendees || []).filter(
            (a) => (a?._id || a)?.toString() !== currentUser?._id?.toString()
          ),
        }));
      }

      setEvents((prev) =>
        prev.map((ev) =>
          ev._id === eventId
            ? { ...ev, isAttending: false, attendeesCount: res.data.attendeesCount }
            : ev
        )
      );
    } catch (err) {
      setRsvpError(err.response?.data?.message || "Unable to cancel RSVP.");
    } finally {
      setRsvpLoading(false);
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId) => {
    try {
      setRsvpLoading(true);
      await API.delete(`/events/${eventId}`);
      setDeleteConfirmId(null);
      closeEventDetail();
    } catch (err) {
      setRsvpError(err.response?.data?.message || "Could not delete event.");
      setRsvpLoading(false);
    }
  };

  // Handle Create Event Form
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newEvent.title.trim()) {
      setCreateError("Please enter an event title.");
      return;
    }
    if (!newEvent.description.trim()) {
      setCreateError("Please provide an event description.");
      return;
    }
    if (!newEvent.date) {
      setCreateError("Please select a date for the event.");
      return;
    }
    if (!newEvent.startTime.trim()) {
      setCreateError("Please provide a start time (e.g. 10:00 AM).");
      return;
    }
    if (!newEvent.location.trim()) {
      setCreateError("Please provide a location/venue.");
      return;
    }

    try {
      setCreateSubmitting(true);
      setCreateError("");

      const formData = new FormData();
      formData.append("title", newEvent.title.trim());
      formData.append("description", newEvent.description.trim());
      formData.append("category", newEvent.category);
      formData.append("date", newEvent.date);
      formData.append("startTime", newEvent.startTime.trim());
      if (newEvent.endTime.trim()) formData.append("endTime", newEvent.endTime.trim());
      formData.append("location", newEvent.location.trim());
      if (newEvent.capacity) formData.append("capacity", newEvent.capacity);
      formData.append("registrationRequired", newEvent.registrationRequired);
      if (newEvent.college.trim()) formData.append("college", newEvent.college.trim());
      if (newEvent.branch.trim()) formData.append("branch", newEvent.branch.trim());
      if (newEvent.imageFile) {
        formData.append("image", newEvent.imageFile);
      }

      const res = await API.post("/events", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowCreateModal(false);
      setNewEvent({
        title: "",
        description: "",
        category: "Hackathon",
        date: "",
        startTime: "",
        endTime: "",
        location: "",
        capacity: "",
        registrationRequired: false,
        college: currentUser?.college || "",
        branch: currentUser?.branch || "",
        imageFile: null,
        imagePreview: "",
      });

      // Refresh and open detail of the newly created event
      await fetchEvents();
      if (res.data?.event?._id) {
        openEventDetail(res.data.event._id);
      }
    } catch (err) {
      console.error("Failed to create event:", err);
      setCreateError(err.response?.data?.message || "Failed to create event. Please try again.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewEvent((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  // Helper for image src
  const getImageSource = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API.defaults.baseURL.replace(/\/api$/, "")}${url}`;
  };

  return (
    <div className="events-container" id="events-root">
      {/* Detail View */}
      {selectedEventId && (
        <div className="event-detail-view" id="event-detail-view">
          <button
            type="button"
            className="btn-back-to-events"
            id="btn-back-to-events"
            onClick={closeEventDetail}
          >
            ← Back to All Events
          </button>

          {detailLoading && (
            <div className="loading-state" id="event-detail-loading">
              Loading event details...
            </div>
          )}

          {rsvpError && (
            <div className="form-error-banner" id="event-rsvp-error">
              {rsvpError}
            </div>
          )}

          {!detailLoading && eventDetail && (
            <div className="event-detail-card" id={`event-detail-${eventDetail._id}`}>
              {/* Hero Banner */}
              <div className="event-detail-hero">
                {eventDetail.image ? (
                  <img
                    src={getImageSource(eventDetail.image)}
                    alt={eventDetail.title}
                    className="event-detail-hero-img"
                  />
                ) : (
                  <div className="event-detail-hero-fallback">
                    <span className="hero-icon">
                      {CATEGORY_ICONS[eventDetail.category] || "📅"}
                    </span>
                    <span className="hero-category-text">{eventDetail.category} Event</span>
                  </div>
                )}
              </div>

              <div className="event-detail-hero-content">
                <div className="event-detail-meta-row">
                  <span
                    className={`category-badge ${(eventDetail.category || "other").toLowerCase()}`}
                  >
                    {CATEGORY_ICONS[eventDetail.category]} {eventDetail.category}
                  </span>

                  {eventDetail.registrationRequired && (
                    <span className="category-badge academic">Registration Required</span>
                  )}
                </div>

                <h1 className="event-detail-title">{eventDetail.title}</h1>

                {/* Info Strip */}
                <div className="event-info-strip">
                  <div className="event-info-item">
                    <div className="event-info-item-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div className="event-info-text">
                      <strong>Date & Time</strong>
                      <span>
                        {formatEventDate(eventDetail.date).formatted}
                        <br />
                        {eventDetail.startTime}
                        {eventDetail.endTime ? ` – ${eventDetail.endTime}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="event-info-item">
                    <div className="event-info-item-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div className="event-info-text">
                      <strong>Location</strong>
                      <span>
                        {eventDetail.location}
                        {eventDetail.college && (
                          <>
                            <br />
                            <small style={{ color: "#716b82", fontWeight: 400 }}>
                              {eventDetail.college}
                            </small>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="event-info-item">
                    <div className="event-info-item-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <div className="event-info-text">
                      <strong>Attendance</strong>
                      <span>
                        {eventDetail.attendeesCount || 0} attending
                        {eventDetail.capacity ? ` / ${eventDetail.capacity} capacity` : " (Unlimited)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RSVP / Action Bar */}
                <div className="event-detail-actions" id="event-action-bar">
                  <div className="event-rsvp-cta">
                    {eventDetail.isAttending ? (
                      <button
                        type="button"
                        className="btn-rsvp-large attending"
                        id="btn-event-cancel-rsvp"
                        disabled={rsvpLoading}
                        onClick={() => handleCancelRsvp(eventDetail._id)}
                      >
                        ✓ Attending (Click to Cancel)
                      </button>
                    ) : eventDetail.capacity &&
                      eventDetail.attendeesCount >= eventDetail.capacity ? (
                      <button
                        type="button"
                        className="btn-rsvp-large"
                        disabled
                        style={{ background: "#9ca3af", cursor: "not-allowed" }}
                      >
                        Event Full
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-rsvp-large"
                        id="btn-event-rsvp"
                        disabled={rsvpLoading}
                        onClick={() => handleRsvp(eventDetail._id)}
                      >
                        {rsvpLoading ? "Processing..." : "RSVP / Join Event"}
                      </button>
                    )}
                  </div>

                  {eventDetail.isOrganizer && (
                    <div>
                      {deleteConfirmId === eventDetail._id ? (
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ fontSize: "12.5px", color: "#dc2626", fontWeight: 600 }}>
                            Are you sure?
                          </span>
                          <button
                            type="button"
                            className="btn-delete-event"
                            id="btn-confirm-delete"
                            onClick={() => handleDeleteEvent(eventDetail._id)}
                          >
                            Yes, Delete
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn-delete-event"
                          id="btn-delete-event-trigger"
                          onClick={() => setDeleteConfirmId(eventDetail._id)}
                        >
                          Delete Event
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="event-detail-section">
                  <h3>About This Event</h3>
                  <p className="event-description-text">{eventDetail.description}</p>
                </div>

                {/* Organizer Info */}
                {eventDetail.organizer && (
                  <div className="event-detail-section">
                    <h3>Organizer</h3>
                    <div
                      className="event-organizer-card"
                      id={`organizer-${eventDetail.organizer._id}`}
                      onClick={() => {
                        if (onAuthorClick && eventDetail.organizer._id) {
                          onAuthorClick(eventDetail.organizer._id);
                        }
                      }}
                    >
                      <div className="organizer-avatar">
                        {eventDetail.organizer.profilePicture ? (
                          <img
                            src={getImageSource(eventDetail.organizer.profilePicture)}
                            alt={eventDetail.organizer.name}
                          />
                        ) : (
                          eventDetail.organizer.name?.charAt(0).toUpperCase() || "O"
                        )}
                      </div>
                      <div className="organizer-info">
                        <strong>{eventDetail.organizer.name}</strong>
                        <span>
                          {eventDetail.organizer.role || "Organizer"}
                          {eventDetail.organizer.college ? ` • ${eventDetail.organizer.college}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Attendees Section */}
                <div className="event-detail-section">
                  <h3>
                    Attendees ({Array.isArray(eventDetail.attendees) ? eventDetail.attendees.length : 0})
                  </h3>
                  {Array.isArray(eventDetail.attendees) && eventDetail.attendees.length > 0 ? (
                    <div className="attendees-grid">
                      {eventDetail.attendees.map((attendee) => {
                        const attId = attendee?._id || attendee;
                        const name = attendee?.name || "Campus Student";
                        const college = attendee?.college || attendee?.branch || "";
                        return (
                          <div
                            key={attId}
                            className="attendee-card"
                            id={`attendee-item-${attId}`}
                            onClick={() => {
                              if (onAuthorClick && attendee?._id) {
                                onAuthorClick(attendee._id);
                              }
                            }}
                          >
                            <div className="attendee-avatar">
                              {attendee?.profilePicture ? (
                                <img src={getImageSource(attendee.profilePicture)} alt={name} />
                              ) : (
                                name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="attendee-info">
                              <strong>{name}</strong>
                              {college && <span>{college}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ color: "#858095", fontSize: "14px" }}>
                      No attendees yet. Be the first to join!
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Events Discovery Page */}
      {!selectedEventId && (
        <>
          {/* Header */}
          <div className="events-header">
            <div className="events-header-text">
              {onBack && (
                <button
                  type="button"
                  id="btn-back-to-home"
                  onClick={onBack}
                  className="btn-back-to-events"
                  style={{ marginBottom: "12px", padding: "5px 12px", fontSize: "12.5px" }}
                >
                  ← Back to Feed
                </button>
              )}
              <h1>
                Campus Events <span>✦</span>
              </h1>
              <p>Discover hackathons, seminars, workshops, and campus meetups.</p>
            </div>

            <button
              type="button"
              className="btn-create-event"
              id="btn-open-create-event"
              onClick={() => setShowCreateModal(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Event
            </button>
          </div>

          {/* Controls Bar */}
          <div className="events-controls" id="events-controls-panel">
            <div className="events-tabs-row">
              {/* Upcoming vs Past Tabs */}
              <div className="events-tabs">
                <button
                  type="button"
                  id="tab-upcoming-events"
                  className={`events-tab ${timeFilter === "upcoming" ? "active" : ""}`}
                  onClick={() => setTimeFilter("upcoming")}
                >
                  Upcoming Events
                </button>
                <button
                  type="button"
                  id="tab-past-events"
                  className={`events-tab ${timeFilter === "past" ? "active" : ""}`}
                  onClick={() => setTimeFilter("past")}
                >
                  Past Events
                </button>
              </div>

              {/* Search Bar */}
              <div className="events-search-box">
                <span className="events-search-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  id="events-search-input"
                  placeholder="Search events, venues..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    className="events-search-clear"
                    id="events-search-clear-btn"
                    onClick={() => setSearch("")}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Category Pills */}
            <div className="events-categories-row" id="events-categories-list">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  id={`filter-category-${cat.toLowerCase()}`}
                  className={`events-category-pill ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat !== "All" && CATEGORY_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="form-error-banner" id="events-error-banner" style={{ marginBottom: "20px" }}>
              {error}
              <button
                type="button"
                style={{ marginLeft: "12px", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 600 }}
                onClick={fetchEvents}
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="loading-state" id="events-loading-spinner">
              Loading campus events...
            </div>
          )}

          {/* Empty State */}
          {!loading && events.length === 0 && (
            <div className="events-empty-state" id="events-empty-view">
              <span className="events-empty-icon">📅</span>
              <h3>
                {timeFilter === "upcoming" && !search && selectedCategory === "All"
                  ? "No upcoming events"
                  : timeFilter === "past" && !search && selectedCategory === "All"
                  ? "No past events"
                  : "No events found"}
              </h3>
              <p>
                {search || selectedCategory !== "All"
                  ? "Try adjusting your search query or category filter."
                  : timeFilter === "upcoming"
                  ? "There are no upcoming events scheduled right now. Be the first to organize one!"
                  : "No past events found in this category."}
              </p>
              {search || selectedCategory !== "All" ? (
                <button
                  type="button"
                  className="btn-secondary"
                  id="btn-clear-event-filters"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("All");
                  }}
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-create-event"
                  id="btn-empty-create-event"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Event
                </button>
              )}
            </div>
          )}

          {/* Events Grid */}
          {!loading && events.length > 0 && (
            <div className="events-grid" id="events-grid-list">
              {events.map((event) => {
                const dateInfo = formatEventDate(event.date);
                const isFull = event.capacity && event.attendeesCount >= event.capacity;
                const isPast = timeFilter === "past";

                return (
                  <article
                    key={event._id}
                    className="event-card"
                    id={`event-card-${event._id}`}
                    onClick={() => openEventDetail(event._id)}
                  >
                    {/* Media / Header Banner */}
                    <div className="event-card-media">
                      {event.image ? (
                        <img
                          src={getImageSource(event.image)}
                          alt={event.title}
                          className="event-card-img"
                        />
                      ) : (
                        <div className="event-card-media-fallback">
                          <span className="fallback-icon">
                            {CATEGORY_ICONS[event.category] || "📅"}
                          </span>
                        </div>
                      )}

                      {/* Category Badge Top Right */}
                      <div className="event-card-media-badge">
                        <span
                          className={`category-badge ${(event.category || "other").toLowerCase()}`}
                        >
                          {event.category}
                        </span>
                      </div>

                      {/* Date Badge Bottom Left */}
                      {dateInfo.month && (
                        <div className="event-date-block">
                          <div className="event-date-month">{dateInfo.month}</div>
                          <div className="event-date-day">{dateInfo.day}</div>
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="event-card-body">
                      <h3 className="event-card-title">{event.title}</h3>
                      <p className="event-card-description">{event.description}</p>

                      <div className="event-card-details">
                        <div className="event-detail-row">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>
                            {dateInfo.formatted} • {event.startTime}
                          </span>
                        </div>

                        <div className="event-detail-row">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span>{event.location}</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="event-card-footer">
                        <span className="event-attendees-pill">
                          <span className="event-attendees-dot" />
                          {event.attendeesCount || 0} attending
                        </span>

                        {/* Quick RSVP Button */}
                        {!isPast ? (
                          event.isAttending ? (
                            <button
                              type="button"
                              className="btn-rsvp attending"
                              id={`btn-card-rsvp-${event._id}`}
                              disabled={rsvpLoading}
                              onClick={(e) => handleCancelRsvp(event._id, e)}
                            >
                              ✓ Going
                            </button>
                          ) : isFull ? (
                            <button
                              type="button"
                              className="btn-rsvp disabled"
                              disabled
                            >
                              Full
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-rsvp"
                              id={`btn-card-rsvp-${event._id}`}
                              disabled={rsvpLoading}
                              onClick={(e) => handleRsvp(event._id, e)}
                            >
                              RSVP
                            </button>
                          )
                        ) : (
                          <span style={{ fontSize: "12px", color: "#858095" }}>Ended</span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="modal-overlay" id="create-event-modal" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Campus Event</h2>
              <button
                type="button"
                className="modal-close-btn"
                id="btn-close-create-modal"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                {createError && (
                  <div className="form-error-banner" id="create-event-error-banner">
                    {createError}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="event-title-input">
                    Event Title <span>*</span>
                  </label>
                  <input
                    type="text"
                    id="event-title-input"
                    required
                    placeholder="e.g. Annual Campus Hackathon 2026"
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="event-category-select">
                      Category <span>*</span>
                    </label>
                    <select
                      id="event-category-select"
                      value={newEvent.category}
                      onChange={(e) =>
                        setNewEvent((prev) => ({ ...prev, category: e.target.value }))
                      }
                    >
                      {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_ICONS[cat]} {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="event-date-input">
                      Event Date <span>*</span>
                    </label>
                    <input
                      type="date"
                      id="event-date-input"
                      required
                      value={newEvent.date}
                      onChange={(e) =>
                        setNewEvent((prev) => ({ ...prev, date: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="event-start-time-input">
                      Start Time <span>*</span>
                    </label>
                    <input
                      type="text"
                      id="event-start-time-input"
                      required
                      placeholder="e.g. 10:00 AM"
                      value={newEvent.startTime}
                      onChange={(e) =>
                        setNewEvent((prev) => ({ ...prev, startTime: e.target.value }))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="event-end-time-input">End Time (Optional)</label>
                    <input
                      type="text"
                      id="event-end-time-input"
                      placeholder="e.g. 02:00 PM"
                      value={newEvent.endTime}
                      onChange={(e) =>
                        setNewEvent((prev) => ({ ...prev, endTime: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="event-location-input">
                    Location / Venue <span>*</span>
                  </label>
                  <input
                    type="text"
                    id="event-location-input"
                    required
                    placeholder="e.g. Auditorium Hall B, 2nd Floor"
                    value={newEvent.location}
                    onChange={(e) =>
                      setNewEvent((prev) => ({ ...prev, location: e.target.value }))
                    }
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="event-capacity-input">Max Capacity (Optional)</label>
                    <input
                      type="number"
                      id="event-capacity-input"
                      min="1"
                      placeholder="Leave blank for unlimited"
                      value={newEvent.capacity}
                      onChange={(e) =>
                        setNewEvent((prev) => ({ ...prev, capacity: e.target.value }))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="event-college-input">College / Campus</label>
                    <input
                      type="text"
                      id="event-college-input"
                      placeholder="e.g. Stanford University"
                      value={newEvent.college}
                      onChange={(e) =>
                        setNewEvent((prev) => ({ ...prev, college: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="event-description-input">
                    Description <span>*</span>
                  </label>
                  <textarea
                    id="event-description-input"
                    rows="3"
                    required
                    placeholder="Describe the event, agenda, prizes, prerequisites, or what students should bring..."
                    value={newEvent.description}
                    onChange={(e) =>
                      setNewEvent((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>

                {/* Optional Image */}
                <div className="form-group">
                  <label htmlFor="event-image-input">Banner Image (Optional)</label>
                  <input
                    type="file"
                    id="event-image-input"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {newEvent.imagePreview && (
                    <div style={{ marginTop: "8px", position: "relative", width: "100%", height: "120px", borderRadius: "10px", overflow: "hidden" }}>
                      <img
                        src={newEvent.imagePreview}
                        alt="Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button
                        type="button"
                        style={{
                          position: "absolute",
                          top: "6px",
                          right: "6px",
                          background: "rgba(0,0,0,0.6)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: "24px",
                          height: "24px",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setNewEvent((prev) => ({
                            ...prev,
                            imageFile: null,
                            imagePreview: "",
                          }));
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    id="event-reg-required"
                    checked={newEvent.registrationRequired}
                    onChange={(e) =>
                      setNewEvent((prev) => ({
                        ...prev,
                        registrationRequired: e.target.checked,
                      }))
                    }
                  />
                  <label htmlFor="event-reg-required" style={{ fontSize: "13px", color: "#3b3749", cursor: "pointer" }}>
                    Require formal registration confirmation for attendees
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  id="btn-cancel-create-event"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  id="btn-submit-create-event"
                  disabled={createSubmitting}
                >
                  {createSubmitting ? "Publishing..." : "Publish Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
