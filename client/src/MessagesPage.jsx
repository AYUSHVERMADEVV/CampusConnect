import { useEffect, useState } from "react";
import API from "./api";
import "./messages.css";

function formatConversationTime(dateStr) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    }
  } catch {
    return "";
  }
}

export default function MessagesPage({ onSelectConversation, onBackToHome }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchConversations = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/messages");
      setConversations(res.data?.conversations || []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
      setError(
        err.response?.data?.message || "Unable to load conversations."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    const handleConversationRead = (e) => {
      const partnerId = e.detail?.userId?.toString();
      if (!partnerId) return;
      setConversations((prev) =>
        prev.map((c) => {
          const cId = (c.user?._id || c.user?.id)?.toString();
          if (cId === partnerId) {
            return {
              ...c,
              unreadCount: 0,
              lastMessage: c.lastMessage ? { ...c.lastMessage, isRead: true } : c.lastMessage,
            };
          }
          return c;
        })
      );
    };

    window.addEventListener("conversation-read", handleConversationRead);
    return () => {
      window.removeEventListener("conversation-read", handleConversationRead);
    };
  }, []);

  const handleOpenConversation = (user) => {
    const partnerId = (user?._id || user?.id)?.toString();
    if (partnerId) {
      setConversations((prev) =>
        prev.map((c) => {
          const cId = (c.user?._id || c.user?.id)?.toString();
          if (cId === partnerId) {
            return {
              ...c,
              unreadCount: 0,
              lastMessage: c.lastMessage ? { ...c.lastMessage, isRead: true } : c.lastMessage,
            };
          }
          return c;
        })
      );
    }
    if (onSelectConversation) {
      onSelectConversation(user);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (!search.trim()) return true;
    const name = c.user?.name || "";
    const content = c.lastMessage?.content || "";
    const term = search.toLowerCase();
    return name.toLowerCase().includes(term) || content.toLowerCase().includes(term);
  });

  // Strict deduplication by User ID
  const deduplicatedConversations = [];
  const seenUserIds = new Set();
  for (const c of filteredConversations) {
    const uid = (c.user?._id || c.user?.id)?.toString();
    if (uid && !seenUserIds.has(uid)) {
      seenUserIds.add(uid);
      deduplicatedConversations.push(c);
    } else if (!uid) {
      deduplicatedConversations.push(c);
    }
  }

  return (
    <div className="messages-page">
      <div className="messages-header-wrap">
        <div>
          <h1 className="messages-title">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.7 9.7 0 0 1-4-.9L3 21l1.6-4.1A8.1 8.1 0 0 1 3 12.2 8.4 8.4 0 0 1 12 3.8a8.4 8.4 0 0 1 9 7.7Z" />
            </svg>
            Messages
          </h1>
          <p className="messages-subtitle">
            Private conversations with students and faculty
          </p>
        </div>
      </div>

      {conversations.length > 0 && (
        <div className="messages-search-bar">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9a95aa"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div className="messages-loading">Loading conversations...</div>
      ) : error ? (
        <div className="messages-empty">
          <p style={{ color: "#d9383a" }}>{error}</p>
          <button className="messages-home-btn" onClick={fetchConversations}>
            Try Again
          </button>
        </div>
      ) : conversations.length === 0 ? (
        <div className="messages-empty">
          <div className="messages-empty-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.7 9.7 0 0 1-4-.9L3 21l1.6-4.1A8.1 8.1 0 0 1 3 12.2 8.4 8.4 0 0 1 12 3.8a8.4 8.4 0 0 1 9 7.7Z" />
            </svg>
          </div>
          <h3>No messages yet</h3>
          <p>Start a conversation with someone from their profile.</p>
          <button className="messages-home-btn" onClick={onBackToHome}>
            Back to Home
          </button>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="messages-empty">
          <h3>No matching conversations</h3>
          <p>No conversations found for "{search}".</p>
          <button
            className="messages-home-btn"
            onClick={() => setSearch("")}
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="messages-list-card">
          {deduplicatedConversations.map((conv) => {
            const user = conv.user || {};
            const lastMsg = conv.lastMessage || {};
            const initial = (user.name || "U").charAt(0).toUpperCase();
            const hasUnread = conv.unreadCount > 0;

            return (
              <div
                key={user._id || user.id || lastMsg._id}
                className="conversation-item"
                onClick={() => handleOpenConversation(user)}
              >
                <div className="conversation-avatar-wrap">
                  <div className="conversation-avatar">
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt={user.name} />
                    ) : (
                      initial
                    )}
                  </div>
                  {hasUnread && <span className="conversation-unread-dot" />}
                </div>

                <div className="conversation-info">
                  <div className="conversation-top-row">
                    <h4 className="conversation-user-name">{user.name || "Campus Student"}</h4>
                    <span className="conversation-time">
                      {formatConversationTime(lastMsg.createdAt)}
                    </span>
                  </div>

                  <div className="conversation-bottom-row">
                    <p className={`conversation-preview ${hasUnread ? "unread" : ""}`}>
                      {lastMsg.content || "Sent a message"}
                    </p>
                    {hasUnread && (
                      <span className="conversation-unread-badge">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
