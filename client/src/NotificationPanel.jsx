import React, { useEffect, useRef } from "react";
import UserAvatar from "./UserAvatar";
import "./notifications.css";

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now - date) / 1000));

  if (diffInSeconds < 30) return "Just now";
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getNotificationDetails(notif) {
  if (!notif) {
    return {
      actor: "Someone",
      actionText: "sent you an update",
      icon: "🔔",
      typeClass: "general",
      snippet: "",
    };
  }

  const actor =
    notif.sender?.name ||
    (typeof notif.sender === "string" && notif.sender.trim()
      ? notif.sender
      : "Someone");

  let actionText = "interacted with you";
  let icon = "🔔";
  let typeClass = notif.type || "general";
  let snippet = "";

  switch (notif.type) {
    case "like":
      actionText = "liked your post";
      icon = "❤️";
      if (notif.post?.title) {
        snippet = `"${notif.post.title}"`;
      } else if (notif.post?.content) {
        const text = notif.post.content.trim();
        snippet = text.length > 45 ? `"${text.slice(0, 45)}..."` : `"${text}"`;
      }
      break;

    case "comment":
      actionText = "commented on your post";
      icon = "💬";
      if (notif.comment?.content) {
        const text = notif.comment.content.trim();
        snippet = text.length > 45 ? `"${text.slice(0, 45)}..."` : `"${text}"`;
      } else if (notif.post?.title) {
        snippet = `"${notif.post.title}"`;
      }
      break;

    case "reply":
      actionText = "replied to your comment";
      icon = "💬";
      if (notif.comment?.content) {
        const text = notif.comment.content.trim();
        snippet = text.length > 45 ? `"${text.slice(0, 45)}..."` : `"${text}"`;
      }
      break;

    case "message":
      actionText = "sent you a message";
      icon = "✉️";
      if (notif.message?.content) {
        const text = notif.message.content.trim();
        snippet = text.length > 45 ? `"${text.slice(0, 45)}..."` : `"${text}"`;
      }
      break;

    case "community":
      actionText = "joined your community";
      icon = "👥";
      if (notif.community?.name) {
        snippet = notif.community.name;
      }
      break;

    case "event":
      actionText = "RSVP'd to your event";
      icon = "📅";
      if (notif.event?.title) {
        snippet = notif.event.title;
      }
      break;

    case "lost_found":
      actionText = "contacted you regarding a Lost & Found item";
      icon = "🔍";
      if (notif.post?.title) {
        snippet = notif.post.title;
      } else if (notif.message?.content) {
        const text = notif.message.content.trim();
        snippet = text.length > 45 ? `"${text.slice(0, 45)}..."` : `"${text}"`;
      }
      break;

    default:
      actionText = "sent you an update";
      icon = "🔔";
      typeClass = "general";
      break;
  }

  return { actor, actionText, icon, typeClass, snippet };
}

export default function NotificationPanel({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
  loading = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onNavigate,
}) {
  const panelRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Click outside to close (desktop)
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        !e.target.closest(".icon-button.notification")
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div className="notif-backdrop" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        className="notif-panel"
        role="dialog"
        aria-label="Notifications"
      >
        {/* Header */}
        <div className="notif-header">
          <div className="notif-header-left">
            <h3 className="notif-header-title">Notifications</h3>
            {unreadCount > 0 && (
              <span className="notif-header-count">{unreadCount} new</span>
            )}
          </div>

          <div className="notif-header-actions">
            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-mark-all-btn"
                onClick={onMarkAllAsRead}
                title="Mark all notifications as read"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              className="notif-close-btn"
              onClick={onClose}
              aria-label="Close notifications"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content list */}
        {loading && notifications.length === 0 ? (
          <div className="notif-status-box">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty-icon">🔔</div>
            <h4>No notifications yet</h4>
            <p>
              When people interact with your posts, messages, communities, or
              events, you'll see notifications here.
            </p>
          </div>
        ) : (
          <ul className="notif-list">
            {notifications.map((notif, index) => {
              const { actor, actionText, icon, typeClass, snippet } =
                getNotificationDetails(notif);
              const isUnread = !notif.read;

              return (
                <li
                  key={notif._id || `notif-${index}-${notif.createdAt || ""}`}
                  className={`notif-item ${isUnread ? "notif-unread unread" : ""}`}
                  onClick={() => {
                    if (isUnread && onMarkAsRead) {
                      onMarkAsRead(notif._id);
                    }
                    if (onNavigate) {
                      onNavigate(notif);
                    }
                  }}
                >
                  <div className="notif-avatar-wrap">
                    <UserAvatar
                      user={notif.sender}
                      name={actor}
                      size={40}
                      className="notif-avatar"
                    />
                    <span className={`notif-type-icon ${typeClass}`}>
                      {icon}
                    </span>
                  </div>

                  <div className="notif-content">
                    <p className="notif-text">
                      <strong className="notif-actor">{actor}</strong>{" "}
                      {actionText}
                    </p>

                    {snippet && <div className="notif-snippet">{snippet}</div>}

                    <div className="notif-meta">
                      <span className="notif-time">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                      {isUnread && <span className="notif-unread-dot" />}
                    </div>
                  </div>

                  <div className="notif-item-actions">
                    {isUnread && (
                      <button
                        type="button"
                        className="notif-read-btn"
                        title="Mark as read"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onMarkAsRead) {
                            onMarkAsRead(notif._id);
                          }
                        }}
                        aria-label="Mark notification as read"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      type="button"
                      className="notif-del-btn"
                      title="Delete notification"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDeleteNotification) {
                          onDeleteNotification(notif._id);
                        }
                      }}
                      aria-label="Delete notification"
                    >
                      ×
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
