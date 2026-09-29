import React, { useState, useRef, useEffect } from "react";
import API from "./api";
import UserAvatar from "./UserAvatar";
import { getImageSource } from "./imageUtils";

function ProfilePage({
  profileUser,
  currentUser,
  posts = [],
  getImageSource: propGetImageSource,
  onBack,
  onMessage,
  onUpdateUser,
}) {
  const resolveImageSource = propGetImageSource || getImageSource;

  // Edit Profile Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    bio: "",
    college: "",
    university: "",
    course: "",
    branch: "",
    year: "",
  });
  const [editError, setEditError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Profile Picture Modal state
  const [isPictureModalOpen, setIsPictureModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [pictureError, setPictureError] = useState("");
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const fileInputRef = useRef(null);

  // Other user follow button toggle (no fake counter)
  const [isFollowing, setIsFollowing] = useState(false);

  // Determine if viewing own profile
  const isOwnProfile = Boolean(
    currentUser &&
    profileUser &&
    (
      (currentUser._id && profileUser._id && currentUser._id.toString() === profileUser._id.toString()) ||
      (currentUser.id && profileUser.id && currentUser.id.toString() === profileUser.id.toString()) ||
      (currentUser._id && profileUser.id && currentUser._id.toString() === profileUser.id.toString()) ||
      (currentUser.id && profileUser._id && currentUser.id.toString() === profileUser._id.toString()) ||
      (currentUser.email && profileUser.email && currentUser.email.toLowerCase() === profileUser.email.toLowerCase())
    )
  );

  // Filter posts created by this profile user
  const profileUserIdStr = (profileUser?._id || profileUser?.id)?.toString();
  const userPosts = posts.filter((post) => {
    const authorId = (post.author?._id || post.author?.id || post.author)?.toString();
    return authorId && profileUserIdStr && authorId === profileUserIdStr;
  });

  // Open Edit Profile modal
  const handleOpenEditModal = () => {
    setEditError("");
    setEditForm({
      name: profileUser?.name || "",
      username: profileUser?.username || profileUser?.name?.toLowerCase().replace(/\s+/g, "") || "",
      bio: profileUser?.bio || "",
      college: profileUser?.college || "",
      university: profileUser?.university || "",
      course: profileUser?.course || "",
      branch: profileUser?.branch || "",
      year: profileUser?.year || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      setEditError("Name is required.");
      return;
    }

    try {
      setIsSavingProfile(true);
      setEditError("");

      const res = await API.put("/users/profile", {
        name: editForm.name.trim(),
        username: editForm.username.trim().replace(/^@+/, ""),
        bio: editForm.bio.trim(),
        college: editForm.college.trim(),
        university: editForm.university.trim(),
        course: editForm.course.trim(),
        branch: editForm.branch.trim(),
        year: editForm.year.trim(),
      });

      const updatedUser = res.data?.user;
      if (updatedUser) {
        if (typeof onUpdateUser === "function") {
          onUpdateUser(updatedUser);
        }
      }

      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setEditError(err.response?.data?.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSavingProfileProfile(false);
    }
  };

  const setIsSavingProfileProfile = (val) => {
    setIsSavingProfile(val);
  };

  // Open Change Profile Picture modal
  const handleOpenPictureModal = () => {
    setPictureError("");
    setSelectedFile(null);
    setPreviewUrl("");
    setIsPictureModalOpen(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Type validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type) && !file.type.startsWith("image/")) {
      setPictureError("Please select a valid image file (JPG, PNG, WEBP, or GIF).");
      return;
    }

    // Size validation: 5 MB limit
    if (file.size > 5 * 1024 * 1024) {
      setPictureError("Image file size must be 5 MB or smaller.");
      return;
    }

    setPictureError("");
    setSelectedFile(file);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadPicture = async () => {
    if (!selectedFile) {
      setPictureError("Please choose an image file first.");
      return;
    }

    try {
      setIsUploadingPicture(true);
      setPictureError("");

      const formData = new FormData();
      formData.append("profilePicture", selectedFile);

      const res = await API.post("/users/profile/picture", formData);
      const updatedUser = res.data?.user;

      if (updatedUser && typeof onUpdateUser === "function") {
        onUpdateUser(updatedUser);
      }

      setIsPictureModalOpen(false);
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    } catch (err) {
      console.error("Failed to upload profile picture:", err);
      setPictureError(err.response?.data?.message || "Unable to upload image. Please try again.");
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleRemovePicture = async () => {
    try {
      setIsUploadingPicture(true);
      setPictureError("");

      const res = await API.delete("/users/profile/picture");
      const updatedUser = res.data?.user;

      if (updatedUser && typeof onUpdateUser === "function") {
        onUpdateUser(updatedUser);
      }

      setIsPictureModalOpen(false);
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    } catch (err) {
      console.error("Failed to remove profile picture:", err);
      setPictureError(err.response?.data?.message || "Failed to remove photo. Please try again.");
    } finally {
      setIsUploadingPicture(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!profileUser) {
    return (
      <section className="instagram-profile-page">
        <button type="button" className="profile-back-button" onClick={onBack}>
          ← Back
        </button>
        <div className="profile-no-posts">
          <h3>Loading profile...</h3>
        </div>
      </section>
    );
  }

  const usernameDisplay =
    profileUser.username ||
    profileUser.name?.toLowerCase().replace(/\s+/g, "");

  return (
    <section className="instagram-profile-page">
      {/* Back Button */}
      <button type="button" className="profile-back-button" onClick={onBack}>
        ← Back
      </button>

      {/* Profile Header */}
      <div className="instagram-profile-header">
        {/* Avatar with optional change trigger for own profile */}
        <div className="profile-avatar-wrapper">
          <UserAvatar
            user={profileUser}
            className="instagram-profile-avatar"
            size={135}
            alt={profileUser.name}
          />
          {isOwnProfile && (
            <button
              type="button"
              className="profile-avatar-badge-btn"
              onClick={handleOpenPictureModal}
              title="Change Profile Picture"
              aria-label="Change Profile Picture"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
          )}
        </div>

        {/* Profile Info */}
        <div className="instagram-profile-info">
          <div className="profile-title-row">
            <h1>{profileUser.name}</h1>
          </div>

          <p className="profile-username">@{usernameDisplay}</p>

          {/* Stats - ONLY real posts count, NO hardcoded fake followers */}
          <div className="profile-stats">
            <span>
              <strong>{userPosts.length}</strong>
              {userPosts.length === 1 ? "Post" : "Posts"}
            </span>
          </div>

          {/* Actions: Different for own vs other user */}
          <div className="profile-action-buttons">
            {isOwnProfile ? (
              <>
                <button
                  type="button"
                  className="profile-action-button profile-edit-btn"
                  onClick={handleOpenEditModal}
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  className="profile-message-button profile-picture-btn"
                  onClick={handleOpenPictureModal}
                >
                  Change Profile Picture
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={`profile-action-button ${isFollowing ? "profile-following-btn" : ""}`}
                  onClick={() => setIsFollowing((prev) => !prev)}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
                <button
                  type="button"
                  className="profile-message-button"
                  onClick={() => {
                    if (typeof onMessage === "function") {
                      onMessage(profileUser);
                    }
                  }}
                >
                  Message
                </button>
              </>
            )}
          </div>

          {/* Bio */}
          {profileUser.bio ? (
            <p className="profile-bio-text">{profileUser.bio}</p>
          ) : isOwnProfile ? (
            <p className="profile-bio-placeholder" onClick={handleOpenEditModal}>
              + Add a bio to your profile
            </p>
          ) : null}

          {/* Academic Information Badges */}
          <div className="profile-academic-badges">
            {profileUser.college && (
              <span className="academic-badge" title="College">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
                {profileUser.college}
              </span>
            )}
            {profileUser.university && (
              <span className="academic-badge" title="University">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                {profileUser.university}
              </span>
            )}
            {profileUser.course && (
              <span className="academic-badge" title="Course">
                {profileUser.course}
              </span>
            )}
            {profileUser.branch && (
              <span className="academic-badge" title="Branch / Major">
                {profileUser.branch}
              </span>
            )}
            {profileUser.year && (
              <span className="academic-badge" title="Year">
                {profileUser.year.toLowerCase().includes("year")
                  ? profileUser.year
                  : `Year ${profileUser.year}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="profile-posts-section">
        <div className="profile-posts-heading">
          <h2>Posts</h2>
        </div>

        <div className="profile-posts-grid">
          {userPosts.map((post) => (
            <div className="profile-post-tile" key={post._id}>
              {post.imageUrl ? (
                <img
                  src={resolveImageSource(post.imageUrl)}
                  alt={post.title || "Post"}
                  loading="lazy"
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
              <div className="no-posts-icon">✦</div>
              <h3>No posts yet</h3>
              <p>
                {isOwnProfile
                  ? "When you share something on campus, it will appear here."
                  : "When they share something, it will appear here."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          EDIT PROFILE MODAL
         ========================================================= */}
      {isEditModalOpen && (
        <div className="profile-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div
            className="profile-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="edit-profile-title"
          >
            <div className="profile-modal-header">
              <h3 id="edit-profile-title">Edit Profile</h3>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => setIsEditModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {editError && <div className="profile-modal-error">{editError}</div>}

            <form onSubmit={handleSaveProfile} className="profile-edit-form">
              <div className="profile-form-row">
                <div className="profile-form-group">
                  <label htmlFor="edit-name">Full Name *</label>
                  <input
                    id="edit-name"
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    required
                    placeholder="e.g. Alex Johnson"
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="edit-username">Username</label>
                  <div className="input-with-prefix">
                    <span>@</span>
                    <input
                      id="edit-username"
                      type="text"
                      name="username"
                      value={editForm.username}
                      onChange={handleEditChange}
                      placeholder="username"
                    />
                  </div>
                </div>
              </div>

              <div className="profile-form-group">
                <label htmlFor="edit-bio">Bio</label>
                <textarea
                  id="edit-bio"
                  name="bio"
                  value={editForm.bio}
                  onChange={handleEditChange}
                  rows="3"
                  maxLength="250"
                  placeholder="Share a short intro, projects, or interests..."
                />
                <span className="character-count">{editForm.bio.length}/250</span>
              </div>

              <div className="profile-form-row">
                <div className="profile-form-group">
                  <label htmlFor="edit-college">College *</label>
                  <input
                    id="edit-college"
                    type="text"
                    name="college"
                    value={editForm.college}
                    onChange={handleEditChange}
                    placeholder="e.g. School of Engineering"
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="edit-university">University</label>
                  <input
                    id="edit-university"
                    type="text"
                    name="university"
                    value={editForm.university}
                    onChange={handleEditChange}
                    placeholder="e.g. Stanford University"
                  />
                </div>
              </div>

              <div className="profile-form-row">
                <div className="profile-form-group">
                  <label htmlFor="edit-course">Course</label>
                  <input
                    id="edit-course"
                    type="text"
                    name="course"
                    value={editForm.course}
                    onChange={handleEditChange}
                    placeholder="e.g. B.Tech / BCA / MBA"
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="edit-branch">Branch *</label>
                  <input
                    id="edit-branch"
                    type="text"
                    name="branch"
                    value={editForm.branch}
                    onChange={handleEditChange}
                    placeholder="e.g. Computer Science"
                  />
                </div>
              </div>

              <div className="profile-form-group">
                <label htmlFor="edit-year">Academic Year *</label>
                <input
                  id="edit-year"
                  type="text"
                  name="year"
                  value={editForm.year}
                  onChange={handleEditChange}
                  placeholder="e.g. 1st Year, 2nd Year, 3, Final Year"
                />
              </div>

              <div className="profile-modal-actions">
                <button
                  type="button"
                  className="profile-modal-cancel"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSavingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-modal-submit"
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          CHANGE PROFILE PICTURE MODAL
         ========================================================= */}
      {isPictureModalOpen && (
        <div className="profile-modal-overlay" onClick={() => setIsPictureModalOpen(false)}>
          <div
            className="profile-modal-card profile-picture-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="change-picture-title"
          >
            <div className="profile-modal-header">
              <h3 id="change-picture-title">Change Profile Picture</h3>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => setIsPictureModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {pictureError && <div className="profile-modal-error">{pictureError}</div>}

            <div className="profile-picture-preview-section">
              <div className="picture-preview-circle">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="preview-image" />
                ) : (
                  <UserAvatar
                    user={profileUser}
                    size={130}
                    className="preview-avatar"
                  />
                )}
              </div>
              <p className="picture-preview-caption">
                {previewUrl
                  ? `Selected: ${selectedFile?.name}`
                  : "Choose a JPG, PNG, WEBP or GIF image up to 5 MB."}
              </p>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />

            <div className="profile-picture-button-group">
              <button
                type="button"
                className="profile-choose-file-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPicture}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {selectedFile ? "Choose Different Image" : "Select Photo from Device"}
              </button>

              {profileUser?.profilePicture && !previewUrl && (
                <button
                  type="button"
                  className="profile-remove-photo-btn"
                  onClick={handleRemovePicture}
                  disabled={isUploadingPicture}
                >
                  Remove Current Photo
                </button>
              )}
            </div>

            <div className="profile-modal-actions">
              <button
                type="button"
                className="profile-modal-cancel"
                onClick={() => {
                  if (previewUrl) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl("");
                  setSelectedFile(null);
                  setIsPictureModalOpen(false);
                }}
                disabled={isUploadingPicture}
              >
                Cancel
              </button>
              <button
                type="button"
                className="profile-modal-submit"
                onClick={handleUploadPicture}
                disabled={!selectedFile || isUploadingPicture}
              >
                {isUploadingPicture ? "Uploading..." : "Save Picture"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ProfilePage;
