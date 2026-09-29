import { useEffect, useRef, useState } from "react";
import API from "./api";
import "./App.css";
import "./auth.css";
import "./composer.css";
import ProfilePage from "./ProfilePage";
import UserAvatar from "./UserAvatar";
import { getImageSource } from "./imageUtils";
import ChatPage from "./ChatPage";
import CommunitiesPage from "./CommunitiesPage";
import EventsPage from "./EventsPage";
import MessagesPage from "./MessagesPage";
import LostFoundPage from "./LostFoundPage";
import NotificationPanel from "./NotificationPanel";
import SettingsPage from "./SettingsPage";
import AdminDashboardPage from "./AdminDashboardPage";

function getIndiaGreeting() {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const hourVal = parts.find((p) => p.type === "hour")?.value || "0";
    const minVal = parts.find((p) => p.type === "minute")?.value || "0";
    const hour = parseInt(hourVal, 10) % 24;
    const minute = parseInt(minVal, 10);
    const totalMinutes = hour * 60 + minute;

    if (totalMinutes >= 5 * 60 && totalMinutes < 12 * 60) {
      return "Good morning";
    } else if (totalMinutes >= 12 * 60 && totalMinutes < 17 * 60) {
      return "Good afternoon";
    } else if (totalMinutes >= 17 * 60 && totalMinutes < 21 * 60) {
      return "Good evening";
    } else {
      return "Good night";
    }
  } catch {
    return "Good day";
  }
}

const Icon = ({ name, size = 20 }) => {
  const paths = {
    home: (
      <>
        <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 21v-6h6v6" />
      </>
    ),

    box: (
      <>
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </>
    ),

    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z" />
      </>
    ),

    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),

    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),

    bookmark: <path d="M6 3h12v18l-6-4-6 4z" />,

    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9 7 7m10 10 2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
      </>
    ),

    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </>
    ),

    search: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),

    bell: (
      <>
        <path d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4" />
      </>
    ),

    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),

    image: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9" r="1.5" />
        <path d="m21 15-5-5L5 20" />
      </>
    ),

    smile: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
      </>
    ),

    more: (
      <>
        <circle cx="5" cy="12" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="19" cy="12" r="1" fill="currentColor" />
      </>
    ),

    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    ),

    message: (
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.7 9.7 0 0 1-4-.9L3 21l1.6-4.1A8.1 8.1 0 0 1 3 12.2 8.4 8.4 0 0 1 12 3.8a8.4 8.4 0 0 1 9 7.7Z" />
    ),

    share: (
      <>
        <path d="M12 16V3M7 8l5-5 5 5" />
        <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
      </>
    ),

    chevron: <path d="m9 18 6-6-6-6" />,

    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),

    logout: (
      <>
        <path d="M10 17l5-5-5-5M15 12H3" />
        <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
      </>
    ),
  };

  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
};

const navItems = [
  ["home", "Home"],
  ["message", "Messages"],
  ["users", "Communities"],
  ["calendar", "Events"],
  ["bookmark", "Saved"],
  ["box", "Lost & Found"],
  ["settings", "Settings"],
];

const readSession = () => {
  const token = localStorage.getItem("token");
  const savedUser = localStorage.getItem("user");

  if (!token) return null;

  try {
    return { token, user: savedUser ? JSON.parse(savedUser) : null };
  } catch {
    localStorage.removeItem("user");
    return { token, user: null };
  }
};

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState(
    window.location.hash === "#register" ? "register" : "login"
  );
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    college: "",
    branch: "",
    year: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegistering = mode === "register";

  const switchMode = (nextMode) => {
    setError("");
    setMode(nextMode);
    window.location.hash = nextMode === "register" ? "register" : "login";
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        await API.post("/auth/register", form);
      }

      const loginResponse = await API.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      onAuthenticated(loginResponse.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
        "Unable to continue. Please check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <a className="brand auth-brand" href="#login">
          <span className="brand-mark">C</span>
          <span>
            Campus <span>Hub</span>
          </span>
        </a>

        <p className="auth-eyebrow">STUDENT COMMUNITY</p>
        <h1>{isRegistering ? "Find your campus circle." : "Welcome back."}</h1>
        <p className="auth-copy">
          {isRegistering
            ? "Create your space to share, collaborate, and grow with your campus community."
            : "Sign in to continue the conversations that matter on campus."}
        </p>

        <form className="auth-form" onSubmit={submitAuth}>
          {isRegistering && (
            <label>
              Full name
              <input name="name" value={form.name} onChange={updateField} placeholder="Your full name" required />
            </label>
          )}

          <label>
            Email address
            <input type="email" name="email" value={form.email} onChange={updateField} placeholder="you@college.edu" required />
          </label>

          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={updateField} placeholder="At least 6 characters" minLength="6" required />
          </label>

          {isRegistering && (
            <div className="auth-grid">
              <label>
                College
                <input name="college" value={form.college} onChange={updateField} placeholder="Your college" required />
              </label>
              <label>
                Branch
                <input name="branch" value={form.branch} onChange={updateField} placeholder="e.g. CSE" required />
              </label>
              <label>
                Year
                <select name="year" value={form.year} onChange={updateField} required>
                  <option value="" disabled>Select year</option>
                  <option value="1">First year</option>
                  <option value="2">Second year</option>
                  <option value="3">Third year</option>
                  <option value="4">Fourth year</option>
                </select>
              </label>
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : isRegistering ? "Create account" : "Sign in to Campus Hub"}
            {!isSubmitting && <Icon name="arrow" size={17} />}
          </button>
        </form>

        <p className="auth-switch">
          {isRegistering ? "Already part of Campus Hub?" : "New to Campus Hub?"}
          <button onClick={() => switchMode(isRegistering ? "login" : "register")}>
            {isRegistering ? "Sign in" : "Create an account"}
          </button>
        </p>
      </section>

      <aside className="auth-showcase" aria-hidden="true">
        <div className="auth-orbit orbit-one" />
        <div className="auth-orbit orbit-two" />
        <span className="auth-star">✦</span>
        <p>ONE CAMPUS.</p>
        <h2>Every possibility.</h2>
        <div className="auth-quote"><span>✦</span>Discover your people, ideas, and next opportunity.</div>
      </aside>
    </main>
  );
}
function CommentItem({
  comment,
  comments,
  commentLikes,
  commentLiking,
  toggleCommentLike,
  onReply,
  replyingTo,
  commentText,
  setCommentText,
  commentSubmitting,
  setCommentSubmitting,
  setCommentError,
  setComments,
  postId,
  setReplyingTo,
  setLocalCommentsCount,
}) {
  const replies = comments.filter(
    (reply) =>
      reply.parentComment?._id === comment._id ||
      reply.parentComment === comment._id
  );

  return (
    <div className="comment-thread">
      <div className="comment-item">
        <div className="avatar avatar-comment">
          {(comment.author?.name || "U").charAt(0).toUpperCase()}
        </div>

        <div className="comment-content">
          <div className="comment-meta">
            <strong>
              {comment.author?.name || "Campus Student"}
            </strong>

            <span>
              {new Date(comment.createdAt).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <p>{comment.content}</p>

          <div className="comment-actions">
            <button
              type="button"
              className={
                commentLikes[comment._id]?.isLiked
                  ? "comment-like is-liked"
                  : "comment-like"
              }
              onClick={() => toggleCommentLike(comment._id)}
              disabled={Boolean(commentLiking[comment._id])}
            >
              <Icon name="heart" size={15} />

              {commentLikes[comment._id]?.isLiked
                ? "Liked"
                : "Like"}

              <span>
                {commentLikes[comment._id]?.likesCount ??
                  comment.likes?.length ??
                  0}
              </span>
            </button>

            <button
              type="button"
              className="comment-reply-button"
              onClick={() => onReply(comment._id)}
            >
              Reply
            </button>
          </div>

          {replyingTo === comment._id && (
            <div className="reply-input-row">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={`Reply to ${comment.author?.name || "this comment"
                  }...`}
                maxLength={500}
              />

              <button
                type="button"
                disabled={
                  !commentText.trim() || commentSubmitting
                }
                onClick={async () => {
                  if (!commentText.trim()) return;

                  try {
                    setCommentSubmitting(true);
                    setCommentError("");

                    const response = await API.post(
                      `/comments/${postId}`,
                      {
                        content: commentText.trim(),
                        parentComment: comment._id,
                      }
                    );

                    setComments((current) => [
                      ...current,
                      response.data.comment,
                    ]);

                    setCommentText("");
                    setReplyingTo(null);
                    setLocalCommentsCount(
                      (count) => count + 1
                    );
                  } catch (error) {
                    setCommentError(
                      error.response?.data?.message ||
                      "Unable to add reply. Please try again."
                    );
                  } finally {
                    setCommentSubmitting(false);
                  }
                }}
              >
                {commentSubmitting ? "..." : "Reply"}
              </button>
            </div>
          )}

          {replies.length > 0 && (
            <div className="nested-replies">
              {replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  comments={comments}
                  commentLikes={commentLikes}
                  commentLiking={commentLiking}
                  toggleCommentLike={toggleCommentLike}
                  onReply={onReply}
                  replyingTo={replyingTo}
                  commentText={commentText}
                  setCommentText={setCommentText}
                  commentSubmitting={commentSubmitting}
                  setCommentSubmitting={setCommentSubmitting}
                  setCommentError={setCommentError}
                  setComments={setComments}
                  postId={postId}
                  setReplyingTo={setReplyingTo}
                  setLocalCommentsCount={setLocalCommentsCount}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function Post({
  post,
  fallbackType = "photo",
  onAuthorClick,
}) {

  const [liked, setLiked] = useState(Boolean(post?.isLiked));
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [commentLikes, setCommentLikes] = useState({});
  const [commentLiking, setCommentLiking] = useState({});
  const [editingPost, setEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState(post?.title || "");
  const [editContent, setEditContent] = useState(post?.content || "");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(
    post?.commentsCount || 0
  );
  const [saved, setSaved] = useState(
    Boolean(post?.isSaved)
  );


  const [isSaving, setIsSaving] = useState(false);
  const [likesCount, setLikesCount] = useState(post?.likesCount || 0);
  const [likeError, setLikeError] = useState("");
  const [isLiking, setIsLiking] = useState(false);

  const isRealPost = Boolean(post);

  const toggleLike = async () => {
    if (!isRealPost || isLiking) return;

    if (!localStorage.getItem("token")) {
      setLikeError("Please log in to like a post.");
      return;
    }

    try {
      setIsLiking(true);
      setLikeError("");

      const response = await API.post(`/posts/${post._id}/like`);

      setLiked(response.data.isLiked);
      setLikesCount(response.data.likesCount);
    } catch (error) {
      setLikeError(
        error.response?.data?.message || "Unable to update the like. Please try again."
      );
    } finally {
      setIsLiking(false);
    }
  };
  const toggleSave = async () => {
    if (!isRealPost || isSaving) return;

    if (!localStorage.getItem("token")) {
      alert("Please log in to save a post.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await API.post(
        `/posts/${post._id}/save`
      );

      setSaved(response.data.isSaved);
    } catch (error) {
      console.error("Save post failed:", error);

      alert(
        error.response?.data?.message ||
        "Unable to save post. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };
  const updatePost = async () => {
    if (!post?._id) return;

    if (!editTitle.trim() || !editContent.trim()) {
      alert("Title and content cannot be empty.");
      return;
    }

    try {
      const response = await API.put(`/posts/${post._id}`, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });

      console.log("Post updated:", response.data);

      setEditingPost(false);
      window.location.reload();
    } catch (error) {
      console.error("Update post failed:", error);

      alert(
        error.response?.data?.message ||
        "Unable to update post. Please try again."
      );
    }
  };
  const deletePost = async () => {
    if (!post?._id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmed) return;

    try {
      await API.delete(`/posts/${post._id}`);

      setShowMoreMenu(false);

      window.location.reload();
    } catch (error) {
      console.error("Delete post failed:", error);

      alert(
        error.response?.data?.message ||
        "Unable to delete post. Please try again."
      );
    }
  };
  const loadComments = async () => {
    if (!post?._id) return;

    try {
      setCommentsLoading(true);
      setCommentError("");

      const response = await API.get(`/comments/${post._id}`);

      setComments(response.data.comments || []);
    } catch (error) {
      console.error("Failed to load comments:", error);

      setCommentError(
        error.response?.data?.message ||
        "Unable to load comments. Please try again."
      );
    } finally {
      setCommentsLoading(false);
    }
  };
  const toggleCommentLike = async (commentId) => {
    if (commentLiking[commentId]) return;

    if (!localStorage.getItem("token")) {
      setCommentError("Please log in to like a comment.");
      return;
    }

    try {
      setCommentLiking((current) => ({
        ...current,
        [commentId]: true,
      }));

      setCommentError("");

      const response = await API.post(
        `/comments/${commentId}/like`
      );

      setCommentLikes((current) => ({
        ...current,
        [commentId]: {
          isLiked: response.data.isLiked,
          likesCount: response.data.likesCount,
        },
      }));
    } catch (error) {
      setCommentError(
        error.response?.data?.message ||
        "Unable to update comment like."
      );
    } finally {
      setCommentLiking((current) => ({
        ...current,
        [commentId]: false,
      }));
    }
  };

  const authorName = post?.author?.name || "Campus Student";
  const authorRole = post?.author?.role || "student";

  const title =
    post?.title ||
    (fallbackType === "photo"
      ? "UI/UX Sprint Workshop"
      : "Frontend Developers Wanted");

  const content =
    post?.content ||
    (fallbackType === "photo"
      ? "Finally wrapped up our UI/UX Sprint workshop! Such a talented bunch of creators in one room."
      : "We're looking for frontend developers to join our team for the upcoming Campus Hackathon. React experience is a plus.");

  const category =
    post?.category ||
    (fallbackType === "photo" ? "Design Society" : "Tech Society");

  return (
    <article
      id={post?._id ? `post-${post._id}` : undefined}
      className="post-card"
    >
      <div className="post-head">
        <div
          className="post-author"
          onClick={() => {

            onAuthorClick?.(post?.author?._id)
          }
          }>
          <div className="avatar avatar-ananya">
            {authorName.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{authorName}</strong>

            <span>
              {category} · {authorRole}
            </span>
          </div>
        </div>
        <div className="more-wrapper">
          <button
            type="button"
            className="icon-button more-button"
            aria-label="More options"
            onClick={() => setShowMoreMenu((current) => !current)}
          >
            <Icon name="more" />
          </button>

          {showMoreMenu && (
            <div className="more-menu">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/post/${post?._id}`
                  );
                  setShowMoreMenu(false);
                }}
              >
                Copy post link
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                }}
              >
                Report post
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  setEditingPost(true);
                }}
              >
                Edit post
              </button>
              <button
                type="button"
                onClick={deletePost}
              >
                Delete post
              </button>
            </div>
          )}
        </div>

      </div>

      {editingPost ? (
        <div className="edit-post-form">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Post title"
            maxLength={150}
          />

          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Write your post..."
            maxLength={2000}
            rows={5}
          />

          <div className="edit-post-actions">
            <button
              type="button"
              onClick={() => {
                setEditTitle(post?.title || "");
                setEditContent(post?.content || "");
                setEditingPost(false);
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={updatePost}
            >
              Save changes
            </button>
          </div>
        </div>
      ) : (
        <>
          {title && <h3 className="post-title">{title}</h3>}

          <p className="post-copy">
            {content}
          </p>
        </>
      )}

      {post?.imageUrl && (
        <img
          className="post-image"
          src={getImageSource(post.imageUrl)}
          alt={title || "Campus post"}
        />
      )}

      {!isRealPost && fallbackType === "photo" && (
        <div className="post-visual">
          <div className="visual-grid" />
          <div className="visual-blob blob-a" />
          <div className="visual-blob blob-b" />

          <div className="visual-card">
            <div className="fake-title">
              Design
              <br />
              Sprint
            </div>

            <div className="fake-line" />
            <div className="fake-line short" />
          </div>

          <div className="visual-caption">
            CREATE
            <br />
            <em>WITH</em> PURPOSE
          </div>
        </div>
      )}

      {!isRealPost && fallbackType === "text" && (
        <div className="opportunity">
          <div className="opportunity-mark">&lt;/&gt;</div>

          <div>
            <small>OPEN COLLABORATION</small>
            <h3>Frontend Developers Wanted</h3>
            <p>Join the hackathon build squad</p>
          </div>

          <Icon name="arrow" size={22} />
        </div>
      )}

      <div className="engagement">
        <span>
          <span className="reaction-heart">♥</span>{" "}
          {isRealPost ? likesCount : liked ? 128 : 127} likes
        </span>

        <span>
          {isRealPost ? localCommentsCount : 0} comments · 0 shares
        </span>
      </div>
      <div className="post-actions">
        <button
          onClick={toggleLike}
          className={liked ? "is-liked" : ""}
          disabled={isRealPost && isLiking}
        >
          <Icon name="heart" />
          {isLiking ? "Updating..." : "Like"}
        </button>

        <button
          onClick={() => {
            setCommentsOpen((current) => !current);

            if (!commentsOpen) {
              loadComments();
            }
          }}
        >
          <Icon name="message" />
          Comment
        </button>
        <button
          type="button"
          onClick={toggleSave}
          disabled={isSaving}
          className={saved ? "is-saved" : ""}
        >
          <Icon name="bookmark" />
          {isSaving ? "Saving..." : saved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          onClick={async () => {
            const shareUrl = `${window.location.origin}/post/${post?._id}`;

            try {
              if (navigator.share) {
                await navigator.share({
                  title: title,
                  text: content,
                  url: shareUrl,
                });
              } else {
                await navigator.clipboard.writeText(shareUrl);
                alert("Post link copied!");
              }
            } catch (error) {
              // User cancelled native share — do nothing
              if (error.name !== "AbortError") {
                console.error("Share failed:", error);
              }
            }
          }}
        >
          <Icon name="share" />
          Share
        </button>
      </div>
      {commentsOpen && isRealPost && (
        <div className="comments-section">
          <div className="comments-header">
            <strong>Comments</strong>
            <span>{localCommentsCount}</span>
          </div>

          {commentsLoading && (
            <p className="comments-status">Loading comments...</p>
          )}

          {commentError && (
            <p className="comments-error">{commentError}</p>
          )}

          {!commentsLoading && !commentError && comments.length === 0 && (
            <p className="comments-status">
              No comments yet. Be the first to comment.
            </p>
          )}

          {!commentsLoading &&
            comments
              .filter((comment) => !comment.parentComment)
              .map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  comments={comments}
                  commentLikes={commentLikes}
                  commentLiking={commentLiking}
                  toggleCommentLike={toggleCommentLike}
                  onReply={(commentId) => {
                    setReplyingTo(
                      replyingTo === commentId ? null : commentId
                    );
                    setCommentText("");
                  }}
                  replyingTo={replyingTo}
                  commentText={commentText}
                  setCommentText={setCommentText}
                  commentSubmitting={commentSubmitting}
                  setCommentSubmitting={setCommentSubmitting}
                  setCommentError={setCommentError}
                  setComments={setComments}
                  postId={post._id}
                  setReplyingTo={setReplyingTo}
                  setLocalCommentsCount={setLocalCommentsCount}
                />
              ))}

          <div className="comment-input-row">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              maxLength={500}
              disabled={commentSubmitting}
            />

            <button
              type="button"
              disabled={!commentText.trim() || commentSubmitting}
              onClick={async () => {
                if (!commentText.trim()) return;

                try {
                  setCommentSubmitting(true);
                  setCommentError("");

                  const response = await API.post(
                    `/comments/${post._id}`,
                    {
                      content: commentText.trim(),
                    }
                  );

                  setComments((current) => [
                    ...current,
                    response.data.comment,
                  ]);

                  setCommentText("");

                  setLocalCommentsCount((count) => count + 1);
                } catch (error) {
                  setCommentError(
                    error.response?.data?.message ||
                    "Unable to add comment. Please try again."
                  );
                } finally {
                  setCommentSubmitting(false);
                }
              }}
            >
              {commentSubmitting ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
      {likeError && <p className="error-state">{likeError}</p>}
    </article>
  );
}

function App() {
  const [session, setSession] = useState(readSession);
  const [active, setActive] = useState("Home");
  const [postDraft, setPostDraft] = useState({
    title: "",
    content: "",
    category: "general",
  });
  const [posted, setPosted] = useState(false);
  const [composerError, setComposerError] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const photoInputRef = useRef(null);
  const [profileUser, setProfileUser] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [chatReturnPage, setChatReturnPage] = useState("messages");
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postError, setPostError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // Sync fresh profile data from server on login / refresh
  useEffect(() => {
    if (!session?.token) return;

    API.get("/users/profile")
      .then((res) => {
        if (res.data?.user) {
          const freshUser = res.data.user;
          setSession((prev) => {
            if (!prev) return prev;
            const merged = { ...prev.user, ...freshUser };
            localStorage.setItem("user", JSON.stringify(merged));
            return { ...prev, user: merged };
          });
        }
      })
      .catch((err) => {
        console.warn("Could not sync user profile:", err.message);
      });
  }, [session?.token]);

  useEffect(() => {
    document.title = "Campus Hub";
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!selectedUser) return;

      try {
        const response = await API.get(`/users/${selectedUser}`);
        setProfileUser(response.data.user);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        const myId = currentUser?._id || currentUser?.id;
        if (selectedUser === myId && currentUser) {
          setProfileUser(currentUser);
        }
      }
    };

    fetchUserProfile();
  }, [selectedUser]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState([]);
  useEffect(() => {
    const searchPosts = async () => {
      const query = searchQuery.trim();

      if (!query) {
        setSearchResults([]);
        setUserSearchResults([]);
        return;
      }

      try {
        setSearchLoading(true);

        const response = await API.get(
          `/posts/search?q=${encodeURIComponent(query)}`
        );

        setSearchResults(response.data.posts || []);

        const userResponse = await API.get(
          `/users/search?q=${encodeURIComponent(query)}`
        );

        setUserSearchResults(userResponse.data.users || []);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
        setUserSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const timer = setTimeout(searchPosts, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loadingSavedPosts, setLoadingSavedPosts] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchUnreadCount = async () => {
    if (!localStorage.getItem("token")) return;
    try {
      const res = await API.get("/notifications/unread-count");
      setUnreadCount(res?.data?.unreadCount || 0);
    } catch (err) {
      console.warn("Could not fetch unread count:", err?.message || err);
    }
  };

  const fetchNotifications = async () => {
    if (!localStorage.getItem("token")) return;
    try {
      setLoadingNotifications(true);
      const res = await API.get("/notifications?limit=30");
      setNotifications(res?.data?.notifications || []);
      setUnreadCount(res?.data?.unreadCount || 0);
    } catch (err) {
      console.warn("Could not fetch notifications:", err?.message || err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchUnreadCount();
      // Polling every 25 seconds for new notifications
      const interval = setInterval(fetchUnreadCount, 25000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const handleMarkAsRead = async (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await API.patch(`/notifications/${notificationId}/read`);
    } catch (err) {
      console.warn("Failed to mark notification read:", err?.message || err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await API.patch("/notifications/read-all");
    } catch (err) {
      console.warn("Failed to mark all read:", err?.message || err);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    const target = notifications.find((n) => n._id === notificationId);
    if (target && !target.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    try {
      await API.delete(`/notifications/${notificationId}`);
    } catch (err) {
      console.warn("Failed to delete notification:", err?.message || err);
    }
  };

  const handleNotificationNavigate = (notification) => {
    setIsNotificationsOpen(false);

    if (notification.type === "message") {
      if (notification.sender) {
        setChatUser(notification.sender);
        setChatReturnPage("messages");
        setCurrentPage("chat");
      }
    } else if (notification.type === "community") {
      setCurrentPage("communities");
      setActive("Communities");
    } else if (notification.type === "event") {
      setCurrentPage("events");
      setActive("Events");
    } else if (notification.type === "lost_found") {
      setCurrentPage("lostfound");
      setActive("Lost & Found");
    } else {
      // like, comment, reply -> navigate to home and scroll to post
      setCurrentPage("home");
      setActive("Home");
      const targetPostId = notification.post?._id || notification.post;
      if (targetPostId) {
        setTimeout(() => {
          const postEl = document.getElementById(`post-${targetPostId}`);
          if (postEl) {
            postEl.scrollIntoView({ behavior: "smooth", block: "center" });
            postEl.classList.add("post-highlight");
            setTimeout(() => postEl.classList.remove("post-highlight"), 2500);
          }
        }, 300);
      }
    }
  };
  useEffect(() => {
    const clearExpiredSession = () => {
      window.location.hash = "login";
      setSession(null);
    };
    window.addEventListener("session-expired", clearExpiredSession);
    return () => window.removeEventListener("session-expired", clearExpiredSession);
  }, []);

  const authenticate = ({ token, user }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    window.location.hash = "dashboard";
    setSession({ token, user });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.hash = "login";
    setSession(null);
  };

  useEffect(() => {
    if (!session) return;

    const fetchPosts = async () => {
      try {
        setLoadingPosts(true);
        setPostError("");

        const response = await API.get("/posts?page=1&limit=10");

        setPosts(response.data.posts || []);
      } catch (error) {
        console.error("Failed to fetch posts:", error);

        setPostError(
          "Unable to load live posts. Please make sure the backend server is running."
        );
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [session]);
  const fetchSavedPosts = async () => {
    try {
      setLoadingSavedPosts(true);

      const response = await API.get("/posts/saved");
      console.log("SAVED POSTS RESPONSE:", response.data);
      setSavedPosts(response.data.posts || []);
    } catch (error) {
      console.error("Failed to fetch saved posts:", error);
      setSavedPosts([]);
    } finally {
      setLoadingSavedPosts(false);
    }
  };
  useEffect(() => {
    if (active === "Saved" || currentPage === "saved") {
      fetchSavedPosts();
    }
  }, [active, currentPage]);

  useEffect(() => {
    if (currentPage === "admin" && session?.user?.role !== "admin") {
      setCurrentPage("home");
      setActive("Home");
    }
  }, [currentPage, session?.user?.role]);
  const updatePostDraft = (event) => {
    const { name, value } = event.target;
    setPostDraft((current) => ({ ...current, [name]: value }));
  };

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview("");

    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  const selectImage = (event) => {
    const image = event.target.files?.[0];

    if (!image) return;

    if (!image.type.startsWith("image/")) {
      setComposerError("Please select an image file.");
      clearSelectedImage();
      return;
    }

    if (image.size > 5 * 1024 * 1024) {
      setComposerError("Image must be 5 MB or smaller.");
      clearSelectedImage();
      return;
    }

    setComposerError("");
    setSelectedImage(image);
    setImagePreview(URL.createObjectURL(image));
  };

  const publish = async () => {
    const title = postDraft.title.trim();
    const content = postDraft.content.trim();

    if (!title || !content) {
      setComposerError("Please add both a title and a message before posting.");
      return;
    }

    try {
      setIsPublishing(true);
      setComposerError("");

      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("category", postDraft.category);

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const response = await API.post("/posts", formData);

      const newPost = {
        ...response.data.post,
        likesCount: response.data.post.likes?.length || 0,
        isLiked: false,
      };

      setPosts((currentPosts) => [newPost, ...currentPosts]);
      setPosted(true);
      setPostDraft({ title: "", content: "", category: "general" });
      clearSelectedImage();
    } catch (error) {
      setComposerError(
        error.response?.data?.message ||
        "Unable to publish your post. Please try again."
      );
    } finally {
      setIsPublishing(false);
    }
  };

  if (!session) {
    return <AuthScreen onAuthenticated={authenticate} />;
  }

  const currentUser = session.user || { name: "Campus Student", role: "student" };

  return (
    <div className="app-shell">
      {/* SIDEBAR */}

      <aside className="sidebar">
        <a className="brand" href="#top">
          <span className="brand-mark">C</span>

          <span>
            Campus <span>Hub</span>
          </span>
        </a>

        <nav className="main-nav">
          {[
            ...navItems.slice(0, 6),
            ...(currentUser?.role === "admin" ? [["shield", "Admin Dashboard"]] : []),
            ...navItems.slice(6),
          ].map(([icon, label]) => {
            const isActive =
              (label === "Home" && currentPage === "home" && !selectedUser) ||
              (label === "Messages" && (currentPage === "messages" || (currentPage === "chat" && chatReturnPage === "messages"))) ||
              (label === "Communities" && currentPage === "communities") ||
              (label === "Events" && currentPage === "events") ||
              (label === "Saved" && currentPage === "saved") ||
              (label === "Lost & Found" && (currentPage === "lostfound" || (currentPage === "chat" && chatReturnPage === "lostfound"))) ||
              (label === "Admin Dashboard" && currentPage === "admin") ||
              (label === "Settings" && currentPage === "settings");

            return (
              <button
                key={label}
                onClick={() => {
                  setActive(label);
                  setProfileUser(null);
                  setSelectedUser(null);
                  setSearchQuery("");
                  if (label === "Home") {
                    setCurrentPage("home");
                  } else if (label === "Messages") {
                    setCurrentPage("messages");
                  } else if (label === "Communities") {
                    setCurrentPage("communities");
                  } else if (label === "Events") {
                    setCurrentPage("events");
                  } else if (label === "Saved") {
                    setCurrentPage("saved");
                  } else if (label === "Lost & Found") {
                    setCurrentPage("lostfound");
                  } else if (label === "Admin Dashboard") {
                    setCurrentPage("admin");
                  } else if (label === "Settings") {
                    setCurrentPage("settings");
                  }
                }}
                className={isActive ? "active" : ""}
                title={label}
                aria-label={label}
              >
                <Icon name={icon} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div
            className="mini-profile"
            onClick={() => {
              setSelectedUser(currentUser._id || currentUser.id);
              setCurrentPage("profile");
              setActive("");
            }}
            style={{ cursor: "pointer" }}
            title="View Profile"
          >
            <UserAvatar
              user={currentUser}
              className="avatar avatar-you"
              size={39}
            />

            <div>
              <strong>{currentUser.name}</strong>
              <span>{currentUser.role || "student"}</span>
            </div>
          </div>

          <button className="settings logout-button" onClick={logout}>
            <Icon name="logout" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <main id="top" className="main-content">
        {currentPage === "home" && (
          <header className="topbar">
            <label className="search">
              <Icon name="search" size={19} />

              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setProfileUser(null);
                  setSelectedUser(null);
                }}
                placeholder="Search posts..."
              />
            </label>

            <div className="top-actions">
              <div className="notif-wrapper">
                <button
                  type="button"
                  className={`icon-button notification ${isNotificationsOpen ? "active" : ""}`}
                  aria-label="Notifications"
                  onClick={() => {
                    setIsNotificationsOpen((prev) => !prev);
                    if (!isNotificationsOpen) {
                      fetchNotifications();
                    }
                  }}
                >
                  <Icon name="bell" />
                  {unreadCount > 0 ? (
                    <span className="notif-badge">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </button>

                <NotificationPanel
                  isOpen={isNotificationsOpen}
                  onClose={() => setIsNotificationsOpen(false)}
                  notifications={notifications}
                  unreadCount={unreadCount}
                  loading={loadingNotifications}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onDeleteNotification={handleDeleteNotification}
                  onNavigate={handleNotificationNavigate}
                />
              </div>

              <button
                className="create-button"
                onClick={() => {
                  const composer =
                    document.querySelector(".composer-title") ||
                    document.querySelector(".composer textarea");
                  composer?.focus();
                  composer?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Icon name="plus" size={18} />
                <span>Create</span>
              </button>
            </div>
          </header>
        )}

        {currentPage === "chat" ? (
          <ChatPage
            chatUser={chatUser || profileUser}
            currentUser={currentUser}
            onBack={() => {
              setCurrentPage(chatReturnPage || "messages");
            }}
          />
        ) : currentPage === "profile" || (selectedUser && profileUser) ? (
          <ProfilePage
            profileUser={profileUser || (selectedUser === (currentUser?._id || currentUser?.id) ? currentUser : null)}
            currentUser={currentUser}
            posts={posts}
            getImageSource={getImageSource}
            onBack={() => {
              setCurrentPage("home");
              setActive("Home");
              setSelectedUser(null);
              setProfileUser(null);
              setChatUser(null);
            }}
            onMessage={(userToChat) => {
              setChatUser(userToChat || profileUser);
              setChatReturnPage("profile");
              setCurrentPage("chat");
            }}
            onUpdateUser={(updatedUser) => {
              setProfileUser(updatedUser);
              setSession((prev) => {
                if (!prev) return prev;
                const nextUser = { ...prev.user, ...updatedUser };
                localStorage.setItem("user", JSON.stringify(nextUser));
                return { ...prev, user: nextUser };
              });
            }}
          />
        ) : currentPage === "messages" ? (
          <MessagesPage
            onSelectConversation={(user) => {
              setChatUser(user);
              setChatReturnPage("messages");
              setCurrentPage("chat");
            }}
            onBackToHome={() => {
              setCurrentPage("home");
              setActive("Home");
            }}
          />
        ) : currentPage === "lostfound" ? (
          <LostFoundPage
            currentUser={currentUser}
            onContactPoster={(poster) => {
              setChatUser(poster);
              setChatReturnPage("lostfound");
              setCurrentPage("chat");
            }}
            onBack={() => {
              setCurrentPage("home");
              setActive("Home");
            }}
          />
        ) : currentPage === "communities" ? (
          <CommunitiesPage
            currentUser={currentUser}
            PostComponent={Post}
            onAuthorClick={(userId) => {
              setSelectedUser(userId);
              setCurrentPage("profile");
            }}
            onBack={() => {
              setCurrentPage("home");
              setActive("Home");
            }}
          />
        ) : currentPage === "events" ? (
          <EventsPage
            currentUser={currentUser}
            onAuthorClick={(userId) => {
              setSelectedUser(userId);
              setCurrentPage("profile");
            }}
            onBack={() => {
              setCurrentPage("home");
              setActive("Home");
            }}
          />
        ) : currentPage === "saved" ? (
          <section className="feed">
            <div className="saved-posts-section">
              <div className="feed-heading">
                <div>
                  <p className="eyebrow">YOUR COLLECTION</p>
                  <h1>Saved Posts <span>✦</span></h1>
                  <p className="subheading">
                    Posts you've bookmarked for later.
                  </p>
                </div>
              </div>

              {loadingSavedPosts ? (
                <p style={{ color: "#7a758d", padding: "20px 0" }}>Loading saved posts...</p>
              ) : savedPosts.length > 0 ? (
                savedPosts.map((post) => (
                  <Post
                    key={post._id}
                    post={post}
                    onAuthorClick={(userId) => {
                      setSelectedUser(userId);
                      setCurrentPage("profile");
                    }}
                  />
                ))
              ) : (
                <div className="empty-saved-posts">
                  <Icon name="bookmark" size={32} />
                  <h3>No saved posts yet</h3>
                  <p>Save a post and it'll appear here.</p>
                </div>
              )}
            </div>
          </section>
        ) : currentPage === "settings" ? (
          <SettingsPage
            currentUser={currentUser}
            onNavigateToProfile={() => {
              setSelectedUser(currentUser?._id || currentUser?.id);
              setCurrentPage("profile");
              setActive("");
            }}
            onOpenNotifications={() => {
              setIsNotificationsOpen(true);
              fetchNotifications();
            }}
            onLogout={logout}
            onAccountDeleted={() => {
              logout();
            }}
          />
        ) : currentPage === "admin" ? (
          <AdminDashboardPage
            currentUser={currentUser}
            onBackToHome={() => {
              setCurrentPage("home");
              setActive("Home");
            }}
            onNavigateToProfile={(userId) => {
              setSelectedUser(userId);
              setCurrentPage("profile");
            }}
          />
        ) : (

          <section className="feed">
            {searchQuery.trim() && (
              <section className="search-results">
                <div className="search-results-header">
                  <h2>Search results</h2>

                  {searchLoading && (
                    <span>Searching...</span>
                  )}
                </div>



                {!searchLoading && searchResults.length === 0 && (
                  <p className="search-empty">
                    No posts found for "{searchQuery}"
                  </p>
                )}
                {!searchLoading && userSearchResults.length > 0 && (
                  <section className="people-results">
                    <div className="search-results-header">
                      <h2>People</h2>
                    </div>

                    <div className="people-list">
                      {userSearchResults.map((user) => (
                        <div
                          className="person-card"
                          key={user._id}
                          onClick={() => {

                            setSelectedUser(user._id);
                            setCurrentPage("profile");
                          }}
                        >
                          <UserAvatar
                            user={user}
                            className="person-avatar"
                            size={46}
                          />

                          <div className="person-info">
                            <strong>{user.name}</strong>
                            <span>{user.role || "Student"}</span>
                            {user.college && <small>{user.college}</small>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                {!searchLoading &&
                  searchResults.map((post) => (
                    <Post
                      key={post._id}
                      post={post}
                      onAuthorClick={(userId) => {
                        setSelectedUser(userId);
                        setCurrentPage("profile");
                      }}
                    />
                  ))}
              </section>
            )}
            {!searchQuery.trim() && (
              <div className="feed-heading">
                <div>
                  <p className="eyebrow">STUDENT COMMUNITY</p>
                  <h1>
                    {getIndiaGreeting()}, {currentUser.name.split(" ")[0]} <span>✦</span>
                  </h1>
                  <p className="subheading">
                    Here's what's happening around your campus.
                  </p>
                </div>

                <button className="filter">
                  For you <span>⌄</span>
                </button>
              </div>
            )}

            {/* COMPOSER */}
            {!searchQuery.trim() && (
              <section className="composer">
                <UserAvatar
                  user={currentUser}
                  className="avatar avatar-you"
                  size={39}
                />

                <div className="composer-body">
                  <input
                    ref={photoInputRef}
                    className="composer-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={selectImage}
                    aria-label="Choose a photo"
                  />

                  <input
                    className="composer-title"
                    name="title"
                    value={postDraft.title}
                    onChange={updatePostDraft}
                    placeholder="Give your post a title"
                    maxLength="150"
                  />

                  <textarea
                    name="content"
                    value={postDraft.content}
                    onChange={updatePostDraft}
                    placeholder="Share something with your campus..."
                    rows="2"
                  />

                  {imagePreview && (
                    <div className="composer-image-preview">
                      <img src={imagePreview} alt="Selected post preview" />
                      <div>
                        <span>{selectedImage?.name}</span>
                        <div className="image-preview-actions">
                          <button type="button" onClick={() => photoInputRef.current?.click()}>
                            Change
                          </button>
                          <button type="button" onClick={clearSelectedImage}>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="composer-foot">
                    <div>
                      <label className="category-picker">
                        <Icon name="smile" size={18} />
                        <select
                          name="category"
                          value={postDraft.category}
                          onChange={updatePostDraft}
                          aria-label="Post category"
                        >
                          <option value="general">General</option>
                          <option value="question">Question</option>
                          <option value="discussion">Discussion</option>
                          <option value="announcement">Announcement</option>
                        </select>
                      </label>

                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={isPublishing}
                      >
                        <Icon name="image" size={18} />
                        {selectedImage ? "Change photo" : "Photo"}
                      </button>
                    </div>

                    <button
                      onClick={publish}
                      className="publish"
                      disabled={isPublishing}
                    >
                      {isPublishing ? "Posting..." : "Post"}
                      {!isPublishing && <Icon name="arrow" size={16} />}
                    </button>
                  </div>

                  {composerError && <p className="composer-error">{composerError}</p>}
                </div>
              </section>
            )}
            {posted && (
              <div className="new-post">
                <div className="avatar avatar-you">A</div>

                <div>
                  <strong>Your post is live!</strong>
                  <p>Your campus community can now see it.</p>
                </div>

                <button onClick={() => setPosted(false)}>×</button>
              </div>
            )}

            <div className="feed-label">
              <span>Latest from your communities</span>
              <i />
            </div>

            {/* LIVE POSTS */}

            {loadingPosts && (
              <div className="loading-state">
                Loading posts...
              </div>
            )}

            {!loadingPosts && postError && (
              <div className="error-state">
                {postError}
              </div>
            )}

            {active === "Saved" ? (
              <div className="saved-posts-section">
                <div className="feed-heading">
                  <div>
                    <p className="eyebrow">YOUR COLLECTION</p>
                    <h1>Saved Posts <span>✦</span></h1>
                    <p className="subheading">
                      Posts you've bookmarked for later.
                    </p>
                  </div>
                </div>

                {loadingSavedPosts ? (
                  <p>Loading saved posts...</p>
                ) : savedPosts.length > 0 ? (
                  savedPosts.map((post) => (
                    <Post
                      key={post._id}
                      post={post}
                      onAuthorClick={(userId) => {
                        setSelectedUser(userId);
                      }}
                    />
                  ))
                ) : (
                  <div className="empty-saved-posts">
                    <Icon name="bookmark" size={32} />
                    <h3>No saved posts yet</h3>
                    <p>Save a post and it'll appear here.</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {!searchQuery.trim() &&
                  !loadingPosts &&
                  !postError &&
                  posts.length > 0 && (
                    posts.map((post) => (
                      <Post key={post._id} post={post}
                        onAuthorClick={(userId) => {
                          setSelectedUser(userId);
                          setCurrentPage("profile");
                        }} />
                    ))
                  )}

                {/* UI FALLBACK */}

                {!loadingPosts && !postError && posts.length === 0 && (
                  <>
                    <Post fallbackType="photo" />
                    <Post fallbackType="text" />
                  </>
                )}
              </>
            )}
          </section>
        )}

      </main>
    </div>
  );
}

export default App;
