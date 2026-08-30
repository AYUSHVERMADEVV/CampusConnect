import { useEffect, useState } from "react";
import API from "./api";
import "./App.css";

const Icon = ({ name, size = 20 }) => {
  const paths = {
    home: (
      <>
        <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 21v-6h6v6" />
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
  ["compass", "Explore"],
  ["users", "Communities"],
  ["calendar", "Events"],
  ["bookmark", "Saved"],
];

function Post({
  post,
  fallbackType = "photo",
}) {
  const [liked, setLiked] = useState(Boolean(post?.isLiked));
  const [likesCount, setLikesCount] = useState(post?.likesCount || 0);
  const [likeError, setLikeError] = useState("");
  const [isLiking, setIsLiking] = useState(false);

  const isRealPost = Boolean(post);

  useEffect(() => {
    setLiked(Boolean(post?.isLiked));
    setLikesCount(post?.likesCount || 0);
  }, [post?._id, post?.isLiked, post?.likesCount]);

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
    <article className="post-card">
      <div className="post-head">
        <div className="avatar avatar-ananya">
          {authorName.charAt(0).toUpperCase()}
        </div>

        <div>
          <strong>{authorName}</strong>

          <span>
            {category} · {authorRole}
          </span>
        </div>

        <button
          className="icon-button more-button"
          aria-label="More options"
        >
          <Icon name="more" />
        </button>
      </div>

      {title && <h3 className="post-title">{title}</h3>}

      <p className="post-copy">
        {content}
      </p>

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
          {post?.comments?.length || 0} comments · 0 shares
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

        <button>
          <Icon name="message" />
          Comment
        </button>

        <button>
          <Icon name="share" />
          Share
        </button>
      </div>

      {likeError && <p className="error-state">{likeError}</p>}
    </article>
  );
}

function App() {
  const [active, setActive] = useState("Home");
  const [draft, setDraft] = useState("");
  const [posted, setPosted] = useState(false);

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postError, setPostError] = useState("");

  useEffect(() => {
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
  }, []);

  const publish = () => {
    if (draft.trim()) {
      setPosted(true);
      setDraft("");
    }
  };

  return (
    <div className="app-shell">
      {/* SIDEBAR */}

      <aside className="sidebar">
        <a className="brand" href="#top">
          <span className="brand-mark">C</span>

          <span>
            Campus<span>Connect</span>
          </span>
        </a>

        <nav className="main-nav">
          {navItems.map(([icon, label]) => (
            <button
              key={label}
              onClick={() => setActive(label)}
              className={active === label ? "active" : ""}
            >
              <Icon name={icon} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="settings">
            <Icon name="settings" />
            <span>Settings</span>
          </button>

          <div className="mini-profile">
            <div className="avatar avatar-you">A</div>

            <div>
              <strong>Ayush Verma</strong>
              <span>Student</span>
            </div>
          </div>

          <Icon name="chevron" size={16} />
        </div>
      </aside>

      {/* MAIN */}

      <main id="top" className="main-content">
        <header className="topbar">
          <label className="search">
            <Icon name="search" size={19} />

            <input placeholder="Search communities, events, people..." />
          </label>

          <div className="top-actions">
            <button
              className="icon-button notification"
              aria-label="Notifications"
            >
              <Icon name="bell" />
              <i />
            </button>

            <button className="create-button">
              <Icon name="plus" size={18} />
              <span>Create</span>
            </button>
          </div>
        </header>

        <section className="feed">
          <div className="feed-heading">
            <div>
              <p className="eyebrow">STUDENT COMMUNITY</p>

              <h1>
                Good afternoon, Ayush <span>✦</span>
              </h1>

              <p className="subheading">
                Here's what's happening around your campus.
              </p>
            </div>

            <button className="filter">
              For you <span>⌄</span>
            </button>
          </div>

          {/* COMPOSER */}

          <section className="composer">
            <div className="avatar avatar-you">A</div>

            <div className="composer-body">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Share something with your campus..."
                rows="2"
              />

              <div className="composer-foot">
                <div>
                  <button>
                    <Icon name="image" size={18} />
                    Photo
                  </button>

                  <button>
                    <Icon name="smile" size={18} />
                    Feeling
                  </button>
                </div>

                <button
                  onClick={publish}
                  className="publish"
                  disabled={!draft.trim()}
                >
                  Post
                  <Icon name="arrow" size={16} />
                </button>
              </div>
            </div>
          </section>

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

          {!loadingPosts && !postError && posts.length > 0 && (
            posts.map((post) => (
              <Post
                key={post._id}
                post={post}
              />
            ))
          )}

          {/* UI FALLBACK */}

          {!loadingPosts && !postError && posts.length === 0 && (
            <>
              <Post fallbackType="photo" />
              <Post fallbackType="text" />
            </>
          )}
        </section>
      </main>

      {/* RIGHT SIDEBAR */}

      <aside className="rightbar">
        <section className="right-card campus-card">
          <div className="campus-orbit">
            <span>✦</span>
          </div>

          <small>YOUR CAMPUS</small>

          <h2>CampusConnect</h2>

          <p>Student Community</p>

          <button>
            Campus hub
            <Icon name="arrow" size={15} />
          </button>
        </section>

        <section className="right-section">
          <div className="section-title">
            <h2>Trending now</h2>
            <button>See all</button>
          </div>

          <div className="trends">
            {[
              ["01", "Hackathon 2026", "Students talking"],
              ["02", "Campus Events", "Students talking"],
              ["03", "Placement prep", "Students talking"],
            ].map(([n, title, sub]) => (
              <a key={n} href={`#${n}`}>
                <b>{n}</b>

                <div>
                  <strong>{title}</strong>
                  <span>{sub}</span>
                </div>

                <Icon name="chevron" size={16} />
              </a>
            ))}
          </div>
        </section>

        <section className="right-section communities">
          <div className="section-title">
            <h2>Your communities</h2>
            <button>Manage</button>
          </div>

          <a href="#design">
            <span className="community-icon design-icon">✦</span>

            <div>
              <strong>Design Society</strong>
              <small>Community</small>
            </div>

            <span className="unread">3</span>
          </a>

          <a href="#tech">
            <span className="community-icon tech-icon">
              &lt;/&gt;
            </span>

            <div>
              <strong>Tech Society</strong>
              <small>Community</small>
            </div>

            <span className="unread">8</span>
          </a>

          <a href="#entre">
            <span className="community-icon entre-icon">↗</span>

            <div>
              <strong>Entrepreneurship</strong>
              <small>Community</small>
            </div>
          </a>
        </section>
      </aside>
    </div>
  );
}

export default App;
