import React from "react";

function ProfilePage({
  profileUser,
  posts,
  getImageSource,
  onBack,
}) {
  if (!profileUser) return null;

  const userPosts = posts.filter(
    (post) => post.author?._id === profileUser._id
  );

  return (
    <section className="instagram-profile-page">

      {/* Back */}
      <button
        type="button"
        className="profile-back-button"
        onClick={onBack}
      >
        ← Back
      </button>

      {/* Profile Header */}
      <div className="instagram-profile-header">

        <div className="instagram-profile-avatar">
          {profileUser.name?.charAt(0).toUpperCase()}
        </div>

        <div className="instagram-profile-info">

          <h1>{profileUser.name}</h1>

          <p className="profile-username">
            @{profileUser.name
              ?.toLowerCase()
              .replace(/\s+/g, "")}
          </p>

          <div className="profile-stats">
            <span>
              <strong>{userPosts.length}</strong>
              Posts
            </span>

            <span>
              <strong>0</strong>
              Followers
            </span>

            <span>
              <strong>0</strong>
              Following
            </span>
          </div>

          <div className="profile-action-buttons">
            <button type="button" className="profile-action-button">
              Follow
            </button>

            <button type="button" className="profile-message-button">
              Message
            </button>
          </div>

          <p className="profile-bio">
            {profileUser.college || "CampusConnect Student"}
            <br />
            {profileUser.branch && `${profileUser.branch} · `}
            {profileUser.year || "Student"}
          </p>

        </div>
      </div>

      {/* Posts */}
      <div className="profile-posts-section">

        <div className="profile-posts-heading">
          <h2>Posts</h2>
        </div>

        <div className="profile-posts-grid">

          {userPosts.map((post) => (
            <div
              className="profile-post-tile"
              key={post._id}
            >
              {post.imageUrl ? (
                <img
                  src={getImageSource(post.imageUrl)}
                  alt={post.title || "Post"}
                />
              ) : (
                <div className="profile-post-text">
                  <strong>{post.title}</strong>
                  <p>{post.content}</p>
                </div>
              )}
            </div>
          ))}

          {userPosts.length === 0 && (
            <div className="profile-no-posts">
              <div>✦</div>
              <h3>No posts yet</h3>
              <p>
                When they share something, it will appear here.
              </p>
            </div>
          )}

        </div>
      </div>

    </section>
  );
}

export default ProfilePage;