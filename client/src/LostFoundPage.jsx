import { useEffect, useRef, useState, useCallback } from "react";
import API from "./api";
import "./lostfound.css";

const CATEGORIES = [
  "All",
  "ID Card",
  "Wallet",
  "Mobile",
  "Laptop",
  "Charger",
  "Keys",
  "Books",
  "Documents",
  "Bag",
  "Clothing",
  "Accessories",
  "Other",
];

const FORM_CATEGORIES = CATEGORIES.filter((c) => c !== "All");

function formatListingDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function LostFoundPage({ currentUser, onContactPoster }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Tabs
  const [tab, setTab] = useState("all"); // "all" | "my" | "resolved"
  const [typeFilter, setTypeFilter] = useState("all"); // "all" | "lost" | "found"
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch] = useState("");

  // Modals
  const [detailItem, setDetailItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "lost",
    category: "ID Card",
    location: "",
    date: new Date().toISOString().slice(0, 10),
    brand: "",
    itemColor: "",
    identifyingDetails: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (search.trim()) params.q = search.trim();
      if (typeFilter !== "all") params.type = typeFilter;
      if (categoryFilter !== "All") params.category = categoryFilter;

      if (tab === "my") {
        params.myListings = "true";
        params.status = "all";
      } else if (tab === "resolved") {
        params.status = "resolved";
      } else {
        params.status = "active";
      }

      const res = await API.get("/lost-found", { params });
      setItems(res.data?.items || []);
    } catch (err) {
      console.error("Failed to load lost & found items:", err);
      setError(
        err.response?.data?.message || "Unable to load Lost & Found listings."
      );
    } finally {
      setLoading(false);
    }
  }, [tab, typeFilter, categoryFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchItems, search]);

  const openCreateModal = (type = "lost") => {
    setEditingItem(null);
    setFormData({
      title: "",
      description: "",
      type,
      category: "ID Card",
      location: "",
      date: new Date().toISOString().slice(0, 10),
      brand: "",
      itemColor: "",
      identifyingDetails: "",
    });
    setSelectedFile(null);
    setFilePreview("");
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || "",
      description: item.description || "",
      type: item.type || "lost",
      category: item.category || "Other",
      location: item.location || "",
      date: item.date ? new Date(item.date).toISOString().slice(0, 10) : "",
      brand: item.brand || "",
      itemColor: item.itemColor || "",
      identifyingDetails: item.identifyingDetails || "",
    });
    setSelectedFile(null);
    setFilePreview(item.image || "");
    setFormError("");
    setModalOpen(true);
    setDetailItem(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!formData.description.trim()) {
      setFormError("Description is required.");
      return;
    }
    if (!formData.location.trim()) {
      setFormError("Location is required.");
      return;
    }
    if (!formData.date) {
      setFormError("Date is required.");
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });
      if (selectedFile) {
        data.append("image", selectedFile);
      }

      if (editingItem) {
        const res = await API.put(`/lost-found/${editingItem._id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const updated = res.data?.item;
        setItems((prev) =>
          prev.map((i) => (i._id === updated._id ? updated : i))
        );
        if (detailItem?._id === updated._id) {
          setDetailItem(updated);
        }
      } else {
        const res = await API.post("/lost-found", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const newItem = res.data?.item;
        if (newItem) {
          setItems((prev) => [newItem, ...prev]);
        }
      }

      setModalOpen(false);
    } catch (err) {
      console.error("Save listing failed:", err);
      setFormError(
        err.response?.data?.message || "Failed to save listing. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (item) => {
    try {
      const res = await API.patch(`/lost-found/${item._id}/resolve`);
      const updated = res.data?.item;
      if (updated) {
        setItems((prev) => {
          if (tab === "all" && updated.status === "resolved") {
            return prev.filter((i) => i._id !== updated._id);
          }
          return prev.map((i) => (i._id === updated._id ? updated : i));
        });
        if (detailItem?._id === updated._id) {
          setDetailItem(updated);
        }
      }
    } catch (err) {
      console.error("Resolve listing failed:", err);
      alert(err.response?.data?.message || "Failed to update listing status.");
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) {
      return;
    }
    try {
      await API.delete(`/lost-found/${itemId}`);
      setItems((prev) => prev.filter((i) => i._id !== itemId));
      if (detailItem?._id === itemId) {
        setDetailItem(null);
      }
    } catch (err) {
      console.error("Delete listing failed:", err);
      alert(err.response?.data?.message || "Failed to delete listing.");
    }
  };

  const isOwner = (item) => {
    if (!currentUser || !item?.postedBy) return false;
    const currentId = (currentUser._id || currentUser.id)?.toString();
    const posterId = (item.postedBy._id || item.postedBy)?.toString();
    return currentId === posterId;
  };

  return (
    <div className="lostfound-page">
      {/* Top Header */}
      <div className="lostfound-header">
        <div className="lostfound-header-info">
          <h1>
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            Lost &amp; Found
          </h1>
          <p>Help return lost items to their owners.</p>
        </div>

        <div className="lostfound-actions">
          <button
            className="btn-report btn-report-lost"
            onClick={() => openCreateModal("lost")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Report Lost Item
          </button>
          <button
            className="btn-report btn-report-found"
            onClick={() => openCreateModal("found")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Report Found Item
          </button>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Tabs */}
      <div className="lostfound-toolbar">
        <div className="lostfound-search-box">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9a95aa"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            type="text"
            placeholder="Search lost &amp; found items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="lostfound-filters-row">
          {/* Tabs: All, My Listings, Resolved */}
          <div className="lostfound-tabs">
            <button
              className={`lostfound-tab-btn ${tab === "all" ? "active" : ""}`}
              onClick={() => setTab("all")}
            >
              All Items
            </button>
            <button
              className={`lostfound-tab-btn ${tab === "my" ? "active" : ""}`}
              onClick={() => setTab("my")}
            >
              My Listings
            </button>
            <button
              className={`lostfound-tab-btn ${tab === "resolved" ? "active" : ""}`}
              onClick={() => setTab("resolved")}
            >
              Resolved
            </button>
          </div>

          {/* Type & Category Selectors */}
          <div className="lostfound-selects">
            <select
              className="lostfound-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>

            <select
              className="lostfound-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content Feed */}
      {loading ? (
        <div className="lostfound-empty">
          <p>Loading Lost &amp; Found listings...</p>
        </div>
      ) : error ? (
        <div className="lostfound-empty">
          <p style={{ color: "#d9383a" }}>{error}</p>
          <button className="btn-primary" onClick={fetchItems}>
            Try Again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="lostfound-empty">
          <div className="lostfound-empty-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <h3>No items found</h3>
          <p>
            {tab === "my"
              ? "You haven't posted any lost or found items yet."
              : tab === "resolved"
              ? "No resolved listings to display."
              : search.trim()
              ? `No items matching "${search}".`
              : "No lost or found items reported yet. Be the first to post!"}
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="btn-primary"
              onClick={() => openCreateModal("lost")}
            >
              + Report an Item
            </button>
            {(search || typeFilter !== "all" || categoryFilter !== "All") && (
              <button
                className="btn-secondary"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("all");
                  setCategoryFilter("All");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="lostfound-grid">
          {items.map((item) => {
            const isLost = item.type === "lost";
            const poster = item.postedBy || {};
            const posterInitial = (poster.name || "U").charAt(0).toUpperCase();

            return (
              <div key={item._id} className="lostfound-card">
                <div className="lostfound-card-image">
                  {item.image ? (
                    <img src={item.image} alt={item.title} />
                  ) : (
                    <div className="lostfound-no-img">
                      <svg
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 20" />
                      </svg>
                      <span>No photo provided</span>
                    </div>
                  )}

                  <span
                    className={`badge-pill ${
                      isLost ? "badge-lost" : "badge-found"
                    }`}
                  >
                    {item.type}
                  </span>

                  <span
                    className={`badge-status ${
                      item.status === "resolved"
                        ? "badge-status-resolved"
                        : "badge-status-active"
                    }`}
                  >
                    {item.status === "resolved" ? "Resolved" : "Active"}
                  </span>
                </div>

                <div className="lostfound-card-body">
                  <span className="lostfound-card-category">
                    {item.category}
                  </span>

                  <h3 className="lostfound-card-title">{item.title}</h3>
                  <p className="lostfound-card-desc">{item.description}</p>

                  <div className="lostfound-meta-list">
                    <div className="lostfound-meta-item">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{item.location}</span>
                    </div>
                    <div className="lostfound-meta-item">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      <span>{formatListingDate(item.date)}</span>
                    </div>
                  </div>

                  <div className="lostfound-card-footer">
                    <div className="lostfound-card-poster">
                      <div className="lostfound-poster-avatar">
                        {posterInitial}
                      </div>
                      <span className="lostfound-poster-name">
                        {poster.name || "Student"}
                      </span>
                    </div>

                    <button
                      className="btn-view-details"
                      onClick={() => setDetailItem(item)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailItem && (
        <div
          className="lf-modal-overlay"
          onClick={() => setDetailItem(null)}
        >
          <div
            className="lf-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lf-modal-header">
              <h2>Item Details</h2>
              <button
                className="lf-modal-close"
                onClick={() => setDetailItem(null)}
              >
                ✕
              </button>
            </div>

            <div className="lf-modal-body">
              {detailItem.image && (
                <div className="lf-detail-image-wrap">
                  <img src={detailItem.image} alt={detailItem.title} />
                </div>
              )}

              <div className="lf-detail-badges">
                <span
                  className={`badge-pill ${
                    detailItem.type === "lost" ? "badge-lost" : "badge-found"
                  }`}
                  style={{ position: "static" }}
                >
                  {detailItem.type}
                </span>

                <span className="lostfound-card-category" style={{ margin: 0 }}>
                  {detailItem.category}
                </span>

                <span
                  className={`badge-status ${
                    detailItem.status === "resolved"
                      ? "badge-status-resolved"
                      : "badge-status-active"
                  }`}
                  style={{ position: "static" }}
                >
                  {detailItem.status === "resolved" ? "Resolved" : "Active"}
                </span>
              </div>

              <h3 style={{ margin: 0, fontSize: "20px", color: "#29243c" }}>
                {detailItem.title}
              </h3>

              <div className="lf-detail-grid">
                <div className="lf-detail-item">
                  <span className="lf-detail-label">Location</span>
                  <span className="lf-detail-value">{detailItem.location}</span>
                </div>
                <div className="lf-detail-item">
                  <span className="lf-detail-label">Date</span>
                  <span className="lf-detail-value">
                    {formatListingDate(detailItem.date)}
                  </span>
                </div>
                {detailItem.brand && (
                  <div className="lf-detail-item">
                    <span className="lf-detail-label">Brand / Make</span>
                    <span className="lf-detail-value">{detailItem.brand}</span>
                  </div>
                )}
                {detailItem.itemColor && (
                  <div className="lf-detail-item">
                    <span className="lf-detail-label">Color</span>
                    <span className="lf-detail-value">
                      {detailItem.itemColor}
                    </span>
                  </div>
                )}
                {detailItem.identifyingDetails && (
                  <div
                    className="lf-detail-item"
                    style={{ gridColumn: "1 / -1" }}
                  >
                    <span className="lf-detail-label">
                      Identifying Details
                    </span>
                    <span className="lf-detail-value">
                      {detailItem.identifyingDetails}
                    </span>
                  </div>
                )}
              </div>

              <div className="lf-detail-desc-box">
                <h4>Description</h4>
                <p>{detailItem.description}</p>
              </div>

              {/* Poster Info Card */}
              <div className="lf-poster-card">
                <div className="lf-poster-left">
                  <div className="lf-poster-avatar-lg">
                    {(detailItem.postedBy?.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="lf-poster-info">
                    <strong>{detailItem.postedBy?.name || "Campus Student"}</strong>
                    <span>
                      {detailItem.postedBy?.role || "Student"}
                      {detailItem.college ? ` • ${detailItem.college}` : ""}
                    </span>
                  </div>
                </div>

                {!isOwner(detailItem) && (
                  <button
                    className="btn-primary"
                    onClick={() => {
                      const poster = detailItem.postedBy;
                      setDetailItem(null);
                      if (onContactPoster) {
                        onContactPoster(poster);
                      }
                    }}
                  >
                    Contact Poster
                  </button>
                )}
              </div>
            </div>

            <div className="lf-modal-footer">
              {isOwner(detailItem) ? (
                <>
                  <button
                    className="btn-secondary"
                    onClick={() => openEditModal(detailItem)}
                  >
                    Edit
                  </button>
                  <button
                    className={
                      detailItem.status === "resolved"
                        ? "btn-secondary"
                        : "btn-resolve"
                    }
                    onClick={() => handleResolve(detailItem)}
                  >
                    {detailItem.status === "resolved"
                      ? "Mark as Active"
                      : "Mark as Resolved"}
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(detailItem._id)}
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button
                  className="btn-secondary"
                  onClick={() => setDetailItem(null)}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div
          className="lf-modal-overlay"
          onClick={() => !submitting && setModalOpen(false)}
        >
          <div
            className="lf-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lf-modal-header">
              <h2>{editingItem ? "Edit Listing" : `Report ${formData.type === "lost" ? "Lost" : "Found"} Item`}</h2>
              <button
                className="lf-modal-close"
                onClick={() => !submitting && setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="lf-modal-body">
                {formError && (
                  <div
                    style={{
                      background: "#fff0f2",
                      color: "#df2c4f",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      fontSize: "13px",
                    }}
                  >
                    {formError}
                  </div>
                )}

                {/* Type selector */}
                <div className="lf-form-group">
                  <label>
                    Type <span>*</span>
                  </label>
                  <div className="lf-type-radio-group">
                    <label
                      className={`lf-type-radio-card ${
                        formData.type === "lost" ? "selected-lost" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value="lost"
                        checked={formData.type === "lost"}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                      />
                      <strong>I Lost Something</strong>
                    </label>
                    <label
                      className={`lf-type-radio-card ${
                        formData.type === "found" ? "selected-found" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value="found"
                        checked={formData.type === "found"}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                      />
                      <strong>I Found Something</strong>
                    </label>
                  </div>
                </div>

                {/* Title */}
                <div className="lf-form-group">
                  <label>
                    Title <span>*</span>
                  </label>
                  <input
                    className="lf-form-input"
                    type="text"
                    placeholder="e.g., Black Lenovo Laptop Backpack"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    maxLength="150"
                    required
                  />
                </div>

                {/* Category & Date */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div className="lf-form-group">
                    <label>
                      Category <span>*</span>
                    </label>
                    <select
                      className="lf-form-select"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    >
                      {FORM_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="lf-form-group">
                    <label>
                      Date {formData.type === "lost" ? "Lost" : "Found"}{" "}
                      <span>*</span>
                    </label>
                    <input
                      className="lf-form-input"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="lf-form-group">
                  <label>
                    Location <span>*</span>
                  </label>
                  <input
                    className="lf-form-input"
                    type="text"
                    placeholder="e.g., Central Library 2nd Floor or Cafeteria"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    maxLength="200"
                    required
                  />
                </div>

                {/* Description */}
                <div className="lf-form-group">
                  <label>
                    Description <span>*</span>
                  </label>
                  <textarea
                    className="lf-form-textarea"
                    rows="3"
                    placeholder="Detailed description of the item, condition, and circumstances..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    maxLength="3000"
                    required
                  />
                </div>

                {/* Brand & Color */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div className="lf-form-group">
                    <label>Brand / Make (Optional)</label>
                    <input
                      className="lf-form-input"
                      type="text"
                      placeholder="e.g., Apple, Dell, Nike"
                      value={formData.brand}
                      onChange={(e) =>
                        setFormData({ ...formData, brand: e.target.value })
                      }
                    />
                  </div>

                  <div className="lf-form-group">
                    <label>Color (Optional)</label>
                    <input
                      className="lf-form-input"
                      type="text"
                      placeholder="e.g., Navy Blue, Silver"
                      value={formData.itemColor}
                      onChange={(e) =>
                        setFormData({ ...formData, itemColor: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Identifying Details */}
                <div className="lf-form-group">
                  <label>Identifying Details (Optional)</label>
                  <input
                    className="lf-form-input"
                    type="text"
                    placeholder="e.g., Stickers on lid, keychains, scratches..."
                    value={formData.identifyingDetails}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        identifyingDetails: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Image Upload */}
                <div className="lf-form-group">
                  <label>Item Photo (Optional)</label>
                  <div
                    className="lf-file-drop"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#858095"
                      strokeWidth="1.8"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 20" />
                    </svg>
                    <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#6a657c" }}>
                      Click to choose an image (PNG, JPG, WEBP)
                    </p>
                  </div>

                  {filePreview && (
                    <div className="lf-file-preview-wrap">
                      <img
                        className="lf-file-preview-img"
                        src={filePreview}
                        alt="Preview"
                      />
                      <button
                        type="button"
                        className="lf-remove-file"
                        onClick={() => {
                          setSelectedFile(null);
                          setFilePreview("");
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="lf-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting
                    ? "Saving..."
                    : editingItem
                    ? "Update Listing"
                    : "Post Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
