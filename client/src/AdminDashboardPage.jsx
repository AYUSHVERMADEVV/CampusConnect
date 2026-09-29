import React, { useState, useEffect, useCallback } from "react";
import API from "./api";
import "./admin.css";

export default function AdminDashboardPage({ currentUser, onBackToHome, onNavigateToProfile }) {
  const isAdmin = currentUser && currentUser.role === "admin";

  const [activeTab, setActiveTab] = useState("overview");
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message }

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Delete",
    isDanger: true,
    action: null,
  });

  // Overview Stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Users State
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  // Communities State
  const [communities, setCommunities] = useState([]);
  const [commTotal, setCommTotal] = useState(0);
  const [commPage, setCommPage] = useState(1);
  const [commTotalPages, setCommTotalPages] = useState(1);
  const [commSearch, setCommSearch] = useState("");
  const [loadingComm, setLoadingComm] = useState(false);

  // Events State
  const [events, setEvents] = useState([]);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsTotalPages, setEventsTotalPages] = useState(1);
  const [eventsSearch, setEventsSearch] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Posts State
  const [posts, setPosts] = useState([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotalPages, setPostsTotalPages] = useState(1);
  const [postsSearch, setPostsSearch] = useState("");
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Lost & Found State
  const [lostFound, setLostFound] = useState([]);
  const [lfTotal, setLfTotal] = useState(0);
  const [lfPage, setLfPage] = useState(1);
  const [lfTotalPages, setLfTotalPages] = useState(1);
  const [lfSearch, setLfSearch] = useState("");
  const [loadingLf, setLoadingLf] = useState(false);

  // Helper to show dismissible alert
  const showAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert((curr) => (curr && curr.message === message ? null : curr));
    }, 6000);
  };

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const res = await API.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
      showAlert(err.response?.data?.message || "Failed to load dashboard statistics", "error");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(async (page = 1, search = "", role = "") => {
    try {
      setLoadingUsers(true);
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (role.trim()) params.role = role.trim();

      const res = await API.get("/admin/users", { params });
      setUsers(res.data.users || []);
      setUsersTotal(res.data.total || 0);
      setUsersPage(res.data.page || 1);
      setUsersTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Failed to load users:", err);
      showAlert(err.response?.data?.message || "Failed to load user list", "error");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Fetch Communities
  const fetchCommunities = useCallback(async (page = 1, search = "") => {
    try {
      setLoadingComm(true);
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();

      const res = await API.get("/admin/communities", { params });
      setCommunities(res.data.communities || []);
      setCommTotal(res.data.total || 0);
      setCommPage(res.data.page || 1);
      setCommTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Failed to load communities:", err);
      showAlert(err.response?.data?.message || "Failed to load communities", "error");
    } finally {
      setLoadingComm(false);
    }
  }, []);

  // Fetch Events
  const fetchEvents = useCallback(async (page = 1, search = "") => {
    try {
      setLoadingEvents(true);
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();

      const res = await API.get("/admin/events", { params });
      setEvents(res.data.events || []);
      setEventsTotal(res.data.total || 0);
      setEventsPage(res.data.page || 1);
      setEventsTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Failed to load events:", err);
      showAlert(err.response?.data?.message || "Failed to load events", "error");
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Fetch Posts
  const fetchPosts = useCallback(async (page = 1, search = "") => {
    try {
      setLoadingPosts(true);
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();

      const res = await API.get("/admin/posts", { params });
      setPosts(res.data.posts || []);
      setPostsTotal(res.data.total || 0);
      setPostsPage(res.data.page || 1);
      setPostsTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Failed to load posts:", err);
      showAlert(err.response?.data?.message || "Failed to load posts", "error");
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  // Fetch Lost & Found
  const fetchLostFound = useCallback(async (page = 1, search = "") => {
    try {
      setLoadingLf(true);
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();

      const res = await API.get("/admin/lost-found", { params });
      setLostFound(res.data.items || []);
      setLfTotal(res.data.total || 0);
      setLfPage(res.data.page || 1);
      setLfTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Failed to load lost & found:", err);
      showAlert(err.response?.data?.message || "Failed to load lost & found items", "error");
    } finally {
      setLoadingLf(false);
    }
  }, []);

  // Initial load based on tab
  useEffect(() => {
    if (activeTab === "overview") fetchStats();
    if (activeTab === "users") fetchUsers(usersPage, userSearch, userRoleFilter);
    if (activeTab === "communities") fetchCommunities(commPage, commSearch);
    if (activeTab === "events") fetchEvents(eventsPage, eventsSearch);
    if (activeTab === "posts") fetchPosts(postsPage, postsSearch);
    if (activeTab === "lostfound") fetchLostFound(lfPage, lfSearch);
  }, [
    activeTab,
    fetchStats,
    fetchUsers,
    usersPage,
    userSearch,
    userRoleFilter,
    fetchCommunities,
    commPage,
    commSearch,
    fetchEvents,
    eventsPage,
    eventsSearch,
    fetchPosts,
    postsPage,
    postsSearch,
    fetchLostFound,
    lfPage,
    lfSearch,
  ]);

  // Handle Role Change
  const handleRoleChange = async (targetUser, newRole) => {
    if (!targetUser || targetUser.role === newRole) return;

    const currentAdminId = (currentUser._id || currentUser.id)?.toString();
    const targetUserId = (targetUser._id || targetUser.id)?.toString();

    // Prevent demoting self
    if (currentAdminId === targetUserId && newRole !== "admin") {
      showAlert("You cannot demote your own account to avoid accidental administrative lockout.", "error");
      return;
    }

    try {
      setUpdatingUserId(targetUserId);
      await API.patch(`/admin/users/${targetUserId}/role`, { role: newRole });
      showAlert(`Updated ${targetUser.name}'s role to "${newRole}".`);
      setUsers((prev) =>
        prev.map((u) => ((u._id || u.id)?.toString() === targetUserId ? { ...u, role: newRole } : u))
      );
      if (stats) fetchStats();
    } catch (err) {
      console.error("Failed to change user role:", err);
      showAlert(err.response?.data?.message || "Could not update user role.", "error");
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Handle Community Delete
  const handleDeleteCommunity = (comm) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Community",
      message: `Are you sure you want to delete "${comm.name}"? This action is permanent and will cascade-delete all community posts.`,
      confirmText: "Delete Community",
      isDanger: true,
      action: async () => {
        try {
          await API.delete(`/communities/${comm._id}`);
          showAlert(`Community "${comm.name}" deleted successfully.`);
          setCommunities((prev) => prev.filter((c) => c._id !== comm._id));
          setCommTotal((t) => Math.max(0, t - 1));
          fetchStats();
        } catch (err) {
          showAlert(err.response?.data?.message || "Could not delete community.", "error");
        }
      },
    });
  };

  // Handle Event Delete
  const handleDeleteEvent = (eventItem) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Event",
      message: `Are you sure you want to delete the event "${eventItem.title}"?`,
      confirmText: "Delete Event",
      isDanger: true,
      action: async () => {
        try {
          await API.delete(`/events/${eventItem._id}`);
          showAlert(`Event "${eventItem.title}" deleted successfully.`);
          setEvents((prev) => prev.filter((e) => e._id !== eventItem._id));
          setEventsTotal((t) => Math.max(0, t - 1));
          fetchStats();
        } catch (err) {
          showAlert(err.response?.data?.message || "Could not delete event.", "error");
        }
      },
    });
  };

  // Handle Post Delete
  const handleDeletePost = (postItem) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Post",
      message: `Are you sure you want to remove this post by ${postItem.author?.name || "a user"}?`,
      confirmText: "Delete Post",
      isDanger: true,
      action: async () => {
        try {
          await API.delete(`/posts/${postItem._id}`);
          showAlert("Post deleted successfully.");
          setPosts((prev) => prev.filter((p) => p._id !== postItem._id));
          setPostsTotal((t) => Math.max(0, t - 1));
          fetchStats();
        } catch (err) {
          showAlert(err.response?.data?.message || "Could not delete post.", "error");
        }
      },
    });
  };

  // Handle Lost & Found Delete
  const handleDeleteLostFound = (item) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Lost & Found Listing",
      message: `Are you sure you want to remove the listing "${item.title}"?`,
      confirmText: "Delete Listing",
      isDanger: true,
      action: async () => {
        try {
          await API.delete(`/lost-found/${item._id}`);
          showAlert(`Listing "${item.title}" deleted successfully.`);
          setLostFound((prev) => prev.filter((lf) => lf._id !== item._id));
          setLfTotal((t) => Math.max(0, t - 1));
          fetchStats();
        } catch (err) {
          showAlert(err.response?.data?.message || "Could not delete listing.", "error");
        }
      },
    });
  };

  if (!isAdmin) {
    return (
      <div className="admin-page-container">
        <div className="admin-state-box" style={{ maxWidth: 500, margin: "60px auto" }}>
          <span style={{ fontSize: 44 }}>🛡️</span>
          <h4>Access Denied</h4>
          <p style={{ marginBottom: 20 }}>
            You do not have administrator permissions to access this control center.
          </p>
          <button className="admin-btn admin-btn-primary" onClick={onBackToHome}>
            Return to Campus Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      {/* Header Area */}
      <div className="admin-header">
        <div className="admin-title-area">
          <h1>
            🛡️ Admin Dashboard <span className="admin-badge-pill">Platform Control</span>
          </h1>
          <p className="admin-subtitle">
            Manage users, permissions, communities, events, and campus moderation from a central console.
          </p>
        </div>

        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-secondary" onClick={onBackToHome}>
            ← Back to Campus Hub
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div className={`admin-alert ${alert.type === "error" ? "admin-alert-error" : "admin-alert-success"}`}>
          <span>{alert.message}</span>
          <button className="admin-alert-close" onClick={() => setAlert(null)}>
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="admin-tabs-nav">
        <button
          className={`admin-tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👥 Users ({usersTotal || stats?.totalUsers || 0})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "communities" ? "active" : ""}`}
          onClick={() => setActiveTab("communities")}
        >
          🏛️ Communities ({commTotal || stats?.totalCommunities || 0})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "events" ? "active" : ""}`}
          onClick={() => setActiveTab("events")}
        >
          📅 Events ({eventsTotal || stats?.totalEvents || 0})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          💬 Posts ({postsTotal || stats?.totalPosts || 0})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "lostfound" ? "active" : ""}`}
          onClick={() => setActiveTab("lostfound")}
        >
          📦 Lost & Found ({lfTotal || stats?.totalLostFound || 0})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div>
          {loadingStats && !stats ? (
            <div className="admin-state-box">
              <p>Loading real-time platform statistics...</p>
            </div>
          ) : (
            <>
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-icon">👥</span>
                  </div>
                  <p className="admin-stat-label">Total Users</p>
                  <h2 className="admin-stat-value">{stats?.totalUsers ?? 0}</h2>
                  <div className="admin-stat-subtext">
                    {stats?.roleBreakdown?.students ?? 0} students · {stats?.roleBreakdown?.clubAdmins ?? 0} club leads · {stats?.roleBreakdown?.admins ?? 0} admins
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-icon">🏛️</span>
                  </div>
                  <p className="admin-stat-label">Total Communities</p>
                  <h2 className="admin-stat-value">{stats?.totalCommunities ?? 0}</h2>
                  <div className="admin-stat-subtext">Clubs, circles & student orgs</div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-icon">📅</span>
                  </div>
                  <p className="admin-stat-label">Total Events</p>
                  <h2 className="admin-stat-value">{stats?.totalEvents ?? 0}</h2>
                  <div className="admin-stat-subtext">Campus activities & meetups</div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-icon">💬</span>
                  </div>
                  <p className="admin-stat-label">Total Posts</p>
                  <h2 className="admin-stat-value">{stats?.totalPosts ?? 0}</h2>
                  <div className="admin-stat-subtext">Campus community updates</div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-icon">📦</span>
                  </div>
                  <p className="admin-stat-label">Lost & Found</p>
                  <h2 className="admin-stat-value">{stats?.totalLostFound ?? 0}</h2>
                  <div className="admin-stat-subtext">Active & resolved listings</div>
                </div>
              </div>

              <div className="admin-overview-panels">
                <div className="admin-panel">
                  <h3>⚡ Quick Administrative Navigation</h3>
                  <div className="admin-quick-actions-grid">
                    <div className="admin-quick-btn" onClick={() => setActiveTab("users")}>
                      <span className="emoji">👥</span>
                      <span className="label">Manage Users</span>
                    </div>
                    <div className="admin-quick-btn" onClick={() => setActiveTab("communities")}>
                      <span className="emoji">🏛️</span>
                      <span className="label">Communities</span>
                    </div>
                    <div className="admin-quick-btn" onClick={() => setActiveTab("events")}>
                      <span className="emoji">📅</span>
                      <span className="label">Events</span>
                    </div>
                    <div className="admin-quick-btn" onClick={() => setActiveTab("posts")}>
                      <span className="emoji">💬</span>
                      <span className="label">Posts Moderation</span>
                    </div>
                    <div className="admin-quick-btn" onClick={() => setActiveTab("lostfound")}>
                      <span className="emoji">📦</span>
                      <span className="label">Lost & Found</span>
                    </div>
                  </div>
                </div>

                <div className="admin-panel">
                  <h3>🔐 Security & Session Status</h3>
                  <p style={{ fontSize: 13.5, color: "var(--muted, #858095)", margin: "0 0 14px", lineHeight: 1.6 }}>
                    Logged in as <strong>{currentUser.name}</strong> ({currentUser.email}).
                  </p>
                  <div style={{ display: "inline-block", marginBottom: 12 }}>
                    <span className="admin-role-badge admin-role-admin">Platform Administrator</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: "var(--muted, #858095)", margin: 0, lineHeight: 1.5 }}>
                    Authorization verified on every backend request via <code>protect</code> and <code>requireAdmin</code>.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === "users" && (
        <div>
          <div className="admin-toolbar">
            <div className="admin-toolbar-left">
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search users by name, email, username or college..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUsersPage(1);
                }}
              />
              <select
                className="admin-select-filter"
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value);
                  setUsersPage(1);
                }}
              >
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="club_admin">Club Admin</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <button className="admin-btn admin-btn-secondary" onClick={() => fetchUsers(usersPage, userSearch, userRoleFilter)}>
              🔄 Refresh
            </button>
          </div>

          <div className="admin-table-container">
            {loadingUsers ? (
              <div className="admin-state-box">
                <p>Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="admin-state-box">
                <h4>No users found</h4>
                <p>Try adjusting your search query or role filter.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>College / Branch</th>
                    <th>Current Role</th>
                    <th>Change Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const uId = (u._id || u.id)?.toString();
                    const isSelf = (currentUser._id || currentUser.id)?.toString() === uId;

                    return (
                      <tr key={uId}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                background: "var(--lav, #f0eafe)",
                                color: "var(--p, #7045d4)",
                                display: "grid",
                                placeItems: "center",
                                fontWeight: 700,
                                fontSize: 13,
                              }}
                            >
                              {u.avatar || u.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{u.name}</div>
                              {u.username && (
                                <div style={{ fontSize: 12, color: "var(--muted, #858095)" }}>@{u.username}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <div>{u.college || "—"}</div>
                          {u.branch && (
                            <div style={{ fontSize: 12, color: "var(--muted, #858095)" }}>{u.branch}</div>
                          )}
                        </td>
                        <td>
                          <span className={`admin-role-badge admin-role-${u.role || "student"}`}>
                            {u.role || "student"}
                          </span>
                        </td>
                        <td>
                          <select
                            className="admin-inline-role-select"
                            value={u.role || "student"}
                            disabled={updatingUserId === uId}
                            onChange={(e) => handleRoleChange(u, e.target.value)}
                          >
                            <option value="student">student</option>
                            <option value="club_admin">club_admin</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td>
                          {onNavigateToProfile && (
                            <button
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                              onClick={() => onNavigateToProfile(uId)}
                            >
                              Profile
                            </button>
                          )}
                          {isSelf && (
                            <span style={{ fontSize: 11, color: "var(--muted, #858095)", marginLeft: 6 }}>
                              (You)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {usersTotalPages > 1 && (
            <div className="admin-pagination">
              <span>
                Showing page {usersPage} of {usersTotalPages} ({usersTotal} total users)
              </span>
              <div className="admin-pagination-btns">
                <button
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  disabled={usersPage <= 1 || loadingUsers}
                  onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  disabled={usersPage >= usersTotalPages || loadingUsers}
                  onClick={() => setUsersPage((p) => Math.min(usersTotalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMMUNITIES */}
      {activeTab === "communities" && (
        <div>
          <div className="admin-toolbar">
            <div className="admin-toolbar-left">
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search communities by name, description, or category..."
                value={commSearch}
                onChange={(e) => {
                  setCommSearch(e.target.value);
                  setCommPage(1);
                }}
              />
            </div>
            <button className="admin-btn admin-btn-secondary" onClick={() => fetchCommunities(commPage, commSearch)}>
              🔄 Refresh
            </button>
          </div>

          <div className="admin-table-container">
            {loadingComm ? (
              <div className="admin-state-box">
                <p>Loading communities...</p>
              </div>
            ) : communities.length === 0 ? (
              <div className="admin-state-box">
                <h4>No communities found</h4>
                <p>Try searching for a different keyword.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Community</th>
                    <th>Category</th>
                    <th>Creator</th>
                    <th>Members</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {communities.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 20 }}>{c.avatar || "🏛️"}</span>
                          <div>
                            <div style={{ fontWeight: 600 }}>{c.name}</div>
                            {c.description && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "var(--muted, #858095)",
                                  maxWidth: 260,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {c.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{c.category || "General"}</span>
                      </td>
                      <td>
                        <div>{c.createdBy?.name || "Unknown"}</div>
                        {c.createdBy?.email && (
                          <div style={{ fontSize: 12, color: "var(--muted, #858095)" }}>{c.createdBy.email}</div>
                        )}
                      </td>
                      <td>👥 {c.membersCount || 1}</td>
                      <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</td>
                      <td>
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => handleDeleteCommunity(c)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {commTotalPages > 1 && (
            <div className="admin-pagination">
              <span>
                Showing page {commPage} of {commTotalPages} ({commTotal} total communities)
              </span>
              <div className="admin-pagination-btns">
                <button
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  disabled={commPage <= 1 || loadingComm}
                  onClick={() => setCommPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  disabled={commPage >= commTotalPages || loadingComm}
                  onClick={() => setCommPage((p) => Math.min(commTotalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EVENTS */}
      {activeTab === "events" && (
        <div>
          <div className="admin-toolbar">
            <div className="admin-toolbar-left">
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search events by title, description, location, or category..."
                value={eventsSearch}
                onChange={(e) => {
                  setEventsSearch(e.target.value);
                  setEventsPage(1);
                }}
              />
            </div>
            <button className="admin-btn admin-btn-secondary" onClick={() => fetchEvents(eventsPage, eventsSearch)}>
              🔄 Refresh
            </button>
          </div>

          <div className="admin-table-container">
            {loadingEvents ? (
              <div className="admin-state-box">
                <p>Loading events...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="admin-state-box">
                <h4>No events found</h4>
                <p>Try searching for a different keyword.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Category</th>
                    <th>Organizer</th>
                    <th>Date & Location</th>
                    <th>Attendees</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ev.title}</div>
                        {ev.description && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--muted, #858095)",
                              maxWidth: 240,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {ev.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{ev.category || "General"}</span>
                      </td>
                      <td>
                        <div>{ev.organizer?.name || "Unknown"}</div>
                        {ev.organizer?.email && (
                          <div style={{ fontSize: 12, color: "var(--muted, #858095)" }}>{ev.organizer.email}</div>
                        )}
                      </td>
                      <td>
                        <div>📅 {ev.date ? new Date(ev.date).toLocaleDateString() : "TBD"}</div>
                        <div style={{ fontSize: 12, color: "var(--muted, #858095)" }}>
                          📍 {ev.location || "Campus"}
                        </div>
                      </td>
                      <td>🎟️ {ev.attendeesCount || 1}</td>
                      <td>
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => handleDeleteEvent(ev)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {eventsTotalPages > 1 && (
            <div className="admin-pagination">
              <span>
                Showing page {eventsPage} of {eventsTotalPages} ({eventsTotal} total events)
              </span>
              <div className="admin-pagination-btns">
                <button
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  disabled={eventsPage <= 1 || loadingEvents}
                  onClick={() => setEventsPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  disabled={eventsPage >= eventsTotalPages || loadingEvents}
                  onClick={() => setEventsPage((p) => Math.min(eventsTotalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: POSTS */}
      {activeTab === "posts" && (
        <div>
          <div className="admin-toolbar">
            <div className="admin-toolbar-left">
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search posts by title, content, or category..."
                value={postsSearch}
                onChange={(e) => {
                  setPostsSearch(e.target.value);
                  setPostsPage(1);
                }}
              />
            </div>
            <button className="admin-btn admin-btn-secondary" onClick={() => fetchPosts(postsPage, postsSearch)}>
              🔄 Refresh
            </button>
          </div>

          <div className="admin-table-container">
            {loadingPosts ? (
              <div className="admin-state-box">
                <p>Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="admin-state-box">
                <h4>No posts found</h4>
                <p>Try searching for a different keyword.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Author</th>
                    <th>Post Content</th>
                    <th>Community</th>
                    <th>Engagement</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.author?.name || "Anonymous"}</div>
                        <div style={{ fontSize: 12, color: "var(--muted, #858095)" }}>
                          {p.author?.role || "student"}
                        </div>
                      </td>
                      <td>
                        {p.title && <div style={{ fontWeight: 600, marginBottom: 2 }}>{p.title}</div>}
                        <div
                          style={{
                            fontSize: 12.5,
                            color: "var(--ink, #292538)",
                            maxWidth: 300,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.content || "—"}
                        </div>
                      </td>
                      <td>{p.community?.name ? `🏛️ ${p.community.name}` : "General Feed"}</td>
                      <td>
                        <span>❤️ {p.likesCount || 0}</span> · <span>💬 {p.commentsCount || 0}</span>
                      </td>
                      <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</td>
                      <td>
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => handleDeletePost(p)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {postsTotalPages > 1 && (
            <div className="admin-pagination">
              <span>
                Showing page {postsPage} of {postsTotalPages} ({postsTotal} total posts)
              </span>
              <div className="admin-pagination-btns">
                <button
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  disabled={postsPage <= 1 || loadingPosts}
                  onClick={() => setPostsPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  disabled={postsPage >= postsTotalPages || loadingPosts}
                  onClick={() => setPostsPage((p) => Math.min(postsTotalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: LOST & FOUND */}
      {activeTab === "lostfound" && (
        <div>
          <div className="admin-toolbar">
            <div className="admin-toolbar-left">
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search lost & found by title, description, or location..."
                value={lfSearch}
                onChange={(e) => {
                  setLfSearch(e.target.value);
                  setLfPage(1);
                }}
              />
            </div>
            <button className="admin-btn admin-btn-secondary" onClick={() => fetchLostFound(lfPage, lfSearch)}>
              🔄 Refresh
            </button>
          </div>

          <div className="admin-table-container">
            {loadingLf ? (
              <div className="admin-state-box">
                <p>Loading lost & found items...</p>
              </div>
            ) : lostFound.length === 0 ? (
              <div className="admin-state-box">
                <h4>No listings found</h4>
                <p>Try searching for a different keyword.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Type / Status</th>
                    <th>Category</th>
                    <th>Posted By</th>
                    <th>Location / Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lostFound.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.title}</div>
                        {item.description && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--muted, #858095)",
                              maxWidth: 240,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 8,
                              background: item.type === "lost" ? "#fee2e2" : "#e0e7ff",
                              color: item.type === "lost" ? "#dc2626" : "#4338ca",
                              textTransform: "uppercase",
                            }}
                          >
                            {item.type || "lost"}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 8,
                              background: item.status === "resolved" ? "#dcfce7" : "#fef3c7",
                              color: item.status === "resolved" ? "#15803d" : "#b45309",
                              textTransform: "uppercase",
                            }}
                          >
                            {item.status || "open"}
                          </span>
                        </div>
                      </td>
                      <td>{item.category || "General"}</td>
                      <td>
                        <div>{item.postedBy?.name || "Unknown"}</div>
                        {item.postedBy?.email && (
                          <div style={{ fontSize: 12, color: "var(--muted, #858095)" }}>{item.postedBy.email}</div>
                        )}
                      </td>
                      <td>
                        <div>📍 {item.location || "Campus"}</div>
                        <div style={{ fontSize: 12, color: "var(--muted, #858095)" }}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                        </div>
                      </td>
                      <td>
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => handleDeleteLostFound(item)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {lfTotalPages > 1 && (
            <div className="admin-pagination">
              <span>
                Showing page {lfPage} of {lfTotalPages} ({lfTotal} total listings)
              </span>
              <div className="admin-pagination-btns">
                <button
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  disabled={lfPage <= 1 || loadingLf}
                  onClick={() => setLfPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  disabled={lfPage >= lfTotalPages || loadingLf}
                  onClick={() => setLfPage((p) => Math.min(lfTotalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="admin-modal-overlay" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{confirmModal.title}</h3>
            <p>{confirmModal.message}</p>
            <div className="admin-modal-actions">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              >
                Cancel
              </button>
              <button
                className={`admin-btn ${confirmModal.isDanger ? "admin-btn-danger" : "admin-btn-primary"}`}
                onClick={async () => {
                  const act = confirmModal.action;
                  setConfirmModal({ ...confirmModal, isOpen: false });
                  if (act) await act();
                }}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
