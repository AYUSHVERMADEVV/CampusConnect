import { useCallback, useEffect, useRef, useState } from "react";
import API from "./api";
import "./communities.css";

const CATEGORIES = ["All", "Course", "Campus", "University", "Club", "Interest"];

const DEFAULT_EMOJIS = ["💻", "🎓", "🚀", "🏛️", "🌐", "⚡", "🎨", "📚", "🔬", "⚽"];

export default function CommunitiesPage({
  currentUser,
  onAuthorClick,
  onBack,
  PostComponent,
}) {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "my"
  const [selectedCommunity, setSelectedCommunity] = useState(null);

  // Detail view state
  const [detailTab, setDetailTab] = useState("feed"); // "feed" | "members"
  const [communityPosts, setCommunityPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  // Create Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    category: "Club",
    course: "",
    branch: "",
    university: "",
    avatar: "💻",
  });
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Community Composer state
  const [postDraft, setPostDraft] = useState({
    title: "",
    content: "",
    category: "general",
  });
  const [postImage, setPostImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [composerError, setComposerError] = useState("");
  const photoInputRef = useRef(null);

  // Fetch all communities
  const fetchCommunities = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory !== "All") params.category = selectedCategory;

      const res = await API.get("/communities", { params });
      setCommunities(res.data.communities || []);
    } catch (err) {
      console.error("Failed to fetch communities:", err);
      setError("Unable to load communities. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(fetchCommunities, 300);
    return () => clearTimeout(timer);
  }, [fetchCommunities]);

  // Fetch community posts and details when a community is selected
  const fetchCommunityDetails = async (id) => {
    try {
      setLoadingPosts(true);
      const [detailRes, postsRes] = await Promise.all([
        API.get(`/communities/${id}`),
        API.get(`/communities/${id}/posts`),
      ]);

      setSelectedCommunity(detailRes.data.community);
      setCommunityPosts(postsRes.data.posts || []);
    } catch (err) {
      console.error("Error loading community details:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleSelectCommunity = (comm) => {
    setSelectedCommunity(comm);
    setDetailTab("feed");
    fetchCommunityDetails(comm._id);
  };

  // Join / Leave community
  const handleToggleJoin = async (e, communityId) => {
    e.stopPropagation();
    if (joiningId) return;

    try {
      setJoiningId(communityId);
      const comm = communities.find((c) => c._id === communityId) || selectedCommunity;
      const isCurrentlyMember = comm?.isMember;

      const endpoint = isCurrentlyMember
        ? `/communities/${communityId}/leave`
        : `/communities/${communityId}/join`;

      const res = await API.post(endpoint);

      // Update in local communities list
      setCommunities((prev) =>
        prev.map((c) => {
          if (c._id === communityId) {
            return {
              ...c,
              isMember: res.data.isMember,
              membersCount: res.data.membersCount,
            };
          }
          return c;
        })
      );

      // Update in selected community if viewing it
      if (selectedCommunity && selectedCommunity._id === communityId) {
        setSelectedCommunity((prev) => ({
          ...prev,
          isMember: res.data.isMember,
          membersCount: res.data.membersCount,
        }));
      }
    } catch (err) {
      console.error("Error toggling join:", err);
    } finally {
      setJoiningId(null);
    }
  };

  // Create Community Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.description.trim()) {
      setCreateError("Name and description are required.");
      return;
    }

    try {
      setIsCreating(true);
      setCreateError("");

      const res = await API.post("/communities", createForm);
      const newCommunity = res.data.community;

      setCommunities((prev) => [newCommunity, ...prev]);
      setShowCreateModal(false);
      setCreateForm({
        name: "",
        description: "",
        category: "Club",
        course: "",
        branch: "",
        university: "",
        avatar: "💻",
      });

      // Navigate to the newly created community
      handleSelectCommunity(newCommunity);
    } catch (err) {
      console.error("Create Community error:", err);
      setCreateError(
        err.response?.data?.message || "Failed to create community. Try another name."
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Post to Community
  const handlePublishCommunityPost = async (e) => {
    e.preventDefault();
    if (!postDraft.title.trim() || !postDraft.content.trim()) {
      setComposerError("Title and content are required.");
      return;
    }

    try {
      setIsPublishing(true);
      setComposerError("");

      const formData = new FormData();
      formData.append("title", postDraft.title.trim());
      formData.append("content", postDraft.content.trim());
      formData.append("category", postDraft.category);
      formData.append("community", selectedCommunity._id);

      if (postImage) {
        formData.append("image", postImage);
      }

      const res = await API.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const createdPost = {
        ...res.data.post,
        likesCount: 0,
        isLiked: false,
        isSaved: false,
      };

      setCommunityPosts((prev) => [createdPost, ...prev]);
      setPostDraft({ title: "", content: "", category: "general" });
      setPostImage(null);
      setImagePreview("");
      if (photoInputRef.current) photoInputRef.current.value = "";
    } catch (err) {
      console.error("Error creating community post:", err);
      setComposerError(
        err.response?.data?.message || "Failed to publish post. You must be a member."
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setComposerError("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setComposerError("Image must be smaller than 5 MB.");
      return;
    }

    setPostImage(file);
    setImagePreview(URL.createObjectURL(file));
    setComposerError("");
  };

  const filteredCommunities = communities.filter((comm) => {
    if (activeTab === "my") {
      return comm.isMember;
    }
    return true;
  });

  return (
    <div className="communities-container">
      {/* ============================================================== */}
      {/* DETAIL VIEW                                                    */}
      {/* ============================================================== */}
      {selectedCommunity ? (
        <div className="community-detail-container">
          <button
            className="btn-back-to-list"
            onClick={() => {
              setSelectedCommunity(null);
              fetchCommunities();
            }}
          >
            ← Back to all communities
          </button>

          <div className="community-detail-hero">
            <div className="community-detail-cover" />
            <div className="community-detail-body">
              <div className="community-detail-header-row">
                <div className="community-detail-avatar-box">
                  <div className="community-detail-avatar">
                    {selectedCommunity.avatar || "🏛️"}
                  </div>
                  <div className="community-detail-title-group">
                    <span
                      className={`community-badge badge-${
                        selectedCommunity.category || "General"
                      }`}
                    >
                      {selectedCommunity.category || "General"}
                    </span>
                    <h2>{selectedCommunity.name}</h2>
                  </div>
                </div>

                <button
                  className={`btn-join-toggle ${
                    selectedCommunity.isMember ? "joined" : ""
                  }`}
                  style={{ minWidth: "140px", height: "42px" }}
                  onClick={(e) => handleToggleJoin(e, selectedCommunity._id)}
                  disabled={joiningId === selectedCommunity._id}
                >
                  {joiningId === selectedCommunity._id
                    ? "Updating..."
                    : selectedCommunity.isMember
                    ? "✓ Joined"
                    : "+ Join Community"}
                </button>
              </div>

              <p className="community-detail-desc">{selectedCommunity.description}</p>

              <div className="community-detail-meta-pills">
                <span>👥 {selectedCommunity.membersCount || 1} members</span>
                {selectedCommunity.course && (
                  <span>🎓 Course: {selectedCommunity.course}</span>
                )}
                {selectedCommunity.branch && (
                  <span>🏛️ Branch/Campus: {selectedCommunity.branch}</span>
                )}
                {selectedCommunity.university && (
                  <span>🌐 University: {selectedCommunity.university}</span>
                )}
                {selectedCommunity.createdBy?.name && (
                  <span>👤 Created by {selectedCommunity.createdBy.name}</span>
                )}
              </div>
            </div>

            <div className="community-detail-tabs">
              <button
                className={`community-nav-tab ${
                  detailTab === "feed" ? "active" : ""
                }`}
                onClick={() => setDetailTab("feed")}
              >
                Discussions & Feed
              </button>
              <button
                className={`community-nav-tab ${
                  detailTab === "members" ? "active" : ""
                }`}
                onClick={() => setDetailTab("members")}
              >
                Members ({selectedCommunity.membersCount || 0})
              </button>
            </div>
          </div>

          {/* DETAIL VIEW TAB: FEED */}
          {detailTab === "feed" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Community Composer */}
              {selectedCommunity.isMember ? (
                <div className="community-composer-card">
                  <div className="community-composer-header">
                    <span>💬 Post in {selectedCommunity.name}{currentUser?.name ? ` as ${currentUser.name}` : ""}</span>
                  </div>

                  <form onSubmit={handlePublishCommunityPost}>
                    <input
                      type="text"
                      placeholder="Title of your discussion or question..."
                      value={postDraft.title}
                      onChange={(e) =>
                        setPostDraft((p) => ({ ...p, title: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        marginBottom: "10px",
                        borderRadius: "10px",
                        border: "1px solid var(--line, #e9e6ef)",
                        fontSize: "14px",
                        fontWeight: "600",
                        outline: "none",
                        background: "#faf9fd",
                      }}
                    />

                    <textarea
                      placeholder="Share an update, lecture notes, or start a discussion..."
                      rows="3"
                      value={postDraft.content}
                      onChange={(e) =>
                        setPostDraft((p) => ({ ...p, content: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid var(--line, #e9e6ef)",
                        fontSize: "14px",
                        resize: "vertical",
                        outline: "none",
                        background: "#faf9fd",
                        fontFamily: "inherit",
                      }}
                    />

                    {imagePreview && (
                      <div
                        style={{
                          margin: "10px 0",
                          position: "relative",
                          display: "inline-block",
                        }}
                      >
                        <img
                          src={imagePreview}
                          alt="Upload preview"
                          style={{
                            maxHeight: "140px",
                            borderRadius: "8px",
                            border: "1px solid #e9e6ef",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPostImage(null);
                            setImagePreview("");
                          }}
                          style={{
                            position: "absolute",
                            top: "4px",
                            right: "4px",
                            background: "rgba(0,0,0,0.6)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: "22px",
                            height: "22px",
                            cursor: "pointer",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}

                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: "none" }}
                    />

                    {composerError && (
                      <p
                        style={{
                          color: "#c92a2a",
                          fontSize: "13px",
                          margin: "8px 0 0",
                        }}
                      >
                        {composerError}
                      </p>
                    )}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "12px",
                      }}
                    >
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <select
                          value={postDraft.category}
                          onChange={(e) =>
                            setPostDraft((p) => ({ ...p, category: e.target.value }))
                          }
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: "1px solid #e9e6ef",
                            fontSize: "12px",
                            background: "#fff",
                          }}
                        >
                          <option value="general">General</option>
                          <option value="question">Question</option>
                          <option value="discussion">Discussion</option>
                          <option value="announcement">Announcement</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          style={{
                            background: "transparent",
                            border: "1px solid #e9e6ef",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            cursor: "pointer",
                            color: "#5d576e",
                          }}
                        >
                          📷 Add Photo
                        </button>
                      </div>

                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={isPublishing}
                      >
                        {isPublishing ? "Posting..." : "Post to Community"}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="community-join-notice">
                  <h3>Join {selectedCommunity.name}</h3>
                  <p>
                    Become a member to share posts, participate in discussions, and
                    interact with fellow students in this community.
                  </p>
                  <button
                    className="btn-primary"
                    onClick={(e) => handleToggleJoin(e, selectedCommunity._id)}
                    disabled={joiningId === selectedCommunity._id}
                  >
                    {joiningId === selectedCommunity._id
                      ? "Joining..."
                      : "Join Community Now"}
                  </button>
                </div>
              )}

              {/* Feed posts */}
              {loadingPosts ? (
                <p style={{ textAlign: "center", color: "var(--muted)", margin: "30px 0" }}>
                  Loading discussions...
                </p>
              ) : communityPosts.length > 0 ? (
                communityPosts.map((post) =>
                  PostComponent ? (
                    <PostComponent
                      key={post._id}
                      post={post}
                      onAuthorClick={onAuthorClick}
                    />
                  ) : null
                )
              ) : (
                <div className="empty-state-box">
                  <h3>No discussions yet</h3>
                  <p>
                    Be the first student to post or ask a question in{" "}
                    {selectedCommunity.name}!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* DETAIL VIEW TAB: MEMBERS */}
          {detailTab === "members" && (
            <div>
              {Array.isArray(selectedCommunity.members) &&
              selectedCommunity.members.length > 0 ? (
                <div className="community-members-grid">
                  {selectedCommunity.members.map((member) => (
                    <div
                      key={member._id || member}
                      className="community-member-card"
                      onClick={() => onAuthorClick && onAuthorClick(member._id || member)}
                    >
                      <div className="community-member-avatar">
                        {(member.name || "S").charAt(0).toUpperCase()}
                      </div>
                      <div className="community-member-info">
                        <strong>{member.name || "Student"}</strong>
                        <span>{member.role || "Member"}</span>
                        {member.college && (
                          <small style={{ color: "#858095", fontSize: "11px" }}>
                            {member.college}
                          </small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-box">
                  <h3>No members found</h3>
                  <p>This community has no visible members.</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ============================================================== */
        /* LIST / DISCOVERY VIEW                                          */
        /* ============================================================== */
        <>
          {onBack && (
            <button
              className="btn-back-to-list"
              style={{ marginBottom: "16px" }}
              onClick={onBack}
            >
              ← Back to Home Feed
            </button>
          )}

          <div className="communities-header">
            <div className="communities-header-text">
              <h1>
                Campus Communities <span>✦</span>
              </h1>
              <p>
                Connect with student circles by college branch, course, university, or
                interests.
              </p>
            </div>

            <button
              className="btn-create-community"
              onClick={() => setShowCreateModal(true)}
            >
              <span>+</span>
              <span>Create Community</span>
            </button>
          </div>

          <div className="communities-controls">
            <div className="communities-tabs-row">
              <div className="communities-tabs">
                <button
                  className={`communities-tab ${activeTab === "all" ? "active" : ""}`}
                  onClick={() => setActiveTab("all")}
                >
                  All Communities
                </button>
                <button
                  className={`communities-tab ${activeTab === "my" ? "active" : ""}`}
                  onClick={() => setActiveTab("my")}
                >
                  My Communities
                </button>
              </div>

              <div className="communities-search-input">
                <span>🔍</span>
                <input
                  type="text"
                  placeholder="Search by name, branch, course..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "var(--muted)",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="communities-categories">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`category-pill ${
                    selectedCategory === cat ? "active" : ""
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p style={{ textAlign: "center", color: "var(--muted)", margin: "40px 0" }}>
              Loading communities...
            </p>
          ) : error ? (
            <div className="empty-state-box">
              <h3>Error</h3>
              <p>{error}</p>
              <button className="btn-secondary" onClick={fetchCommunities}>
                Retry
              </button>
            </div>
          ) : filteredCommunities.length > 0 ? (
            <div className="communities-grid">
              {filteredCommunities.map((comm) => (
                <div
                  key={comm._id}
                  className="community-card"
                  onClick={() => handleSelectCommunity(comm)}
                >
                  <div className="community-card-top">
                    <div className="community-card-avatar">{comm.avatar || "🏛️"}</div>
                    <div className="community-card-info">
                      <span
                        className={`community-badge badge-${comm.category || "General"}`}
                      >
                        {comm.category || "General"}
                      </span>
                      <h3 className="community-card-name" title={comm.name}>
                        {comm.name}
                      </h3>
                    </div>
                  </div>

                  <p className="community-card-desc">{comm.description}</p>

                  <div className="community-card-meta">
                    <span>👥 {comm.membersCount || 1} members</span>
                    {comm.course && <span>🎓 {comm.course}</span>}
                    {comm.branch && <span>🏛️ {comm.branch}</span>}
                  </div>

                  <div className="community-card-actions">
                    <button
                      className={`btn-join-toggle ${comm.isMember ? "joined" : ""}`}
                      onClick={(e) => handleToggleJoin(e, comm._id)}
                      disabled={joiningId === comm._id}
                    >
                      {joiningId === comm._id
                        ? "..."
                        : comm.isMember
                        ? "✓ Joined"
                        : "+ Join"}
                    </button>

                    <button
                      className="btn-view-community"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCommunity(comm);
                      }}
                    >
                      View →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-box">
              <h3>No communities found</h3>
              <p>
                {activeTab === "my"
                  ? "You haven't joined any communities yet. Switch to 'All Communities' to discover and join one!"
                  : "No communities match your current filters. Be the first to create one!"}
              </p>
              {activeTab === "my" ? (
                <button
                  className="btn-primary"
                  onClick={() => setActiveTab("all")}
                >
                  Explore All Communities
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Community
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* ============================================================== */}
      {/* CREATE COMMUNITY MODAL                                         */}
      {/* ============================================================== */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create a Campus Community</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                {createError && (
                  <p
                    style={{
                      color: "#c92a2a",
                      fontSize: "13px",
                      background: "#fdeeee",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      margin: 0,
                    }}
                  >
                    {createError}
                  </p>
                )}

                <div className="form-group">
                  <label>Community Icon</label>
                  <div className="emoji-selector">
                    {DEFAULT_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={`emoji-btn ${
                          createForm.avatar === emoji ? "selected" : ""
                        }`}
                        onClick={() =>
                          setCreateForm((p) => ({ ...p, avatar: emoji }))
                        }
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Community Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. AI & Machine Learning Society"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, name: e.target.value }))
                    }
                    maxLength="80"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={createForm.category}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, category: e.target.value }))
                    }
                  >
                    <option value="Club">Club / Society</option>
                    <option value="Course">Course-Specific</option>
                    <option value="Campus">Campus / Branch</option>
                    <option value="University">University-Wide</option>
                    <option value="Interest">Interest / Hobby</option>
                    <option value="General">General</option>
                  </select>
                </div>

                {createForm.category === "Course" && (
                  <div className="form-group">
                    <label>Course Name</label>
                    <input
                      type="text"
                      placeholder="e.g. BCA, B.Tech CSE, MCA"
                      value={createForm.course}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, course: e.target.value }))
                      }
                    />
                  </div>
                )}

                {createForm.category === "Campus" && (
                  <div className="form-group">
                    <label>Campus / Branch Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Maldahiya Campus, South Block"
                      value={createForm.branch}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, branch: e.target.value }))
                      }
                    />
                  </div>
                )}

                {createForm.category === "University" && (
                  <div className="form-group">
                    <label>University</label>
                    <input
                      type="text"
                      placeholder="e.g. VBSPU"
                      value={createForm.university}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, university: e.target.value }))
                      }
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    rows="3"
                    placeholder="What is the purpose of this community? Who should join?"
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, description: e.target.value }))
                    }
                    maxLength="500"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isCreating}
                >
                  {isCreating ? "Creating..." : "Create Community"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
