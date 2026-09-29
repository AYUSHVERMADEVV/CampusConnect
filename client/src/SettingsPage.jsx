import React, { useState } from "react";
import API from "./api";

function SettingsPage({
  currentUser,
  onNavigateToProfile,
  onOpenNotifications,
  onLogout,
  onAccountDeleted,
}) {
  // Change Password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Delete Account Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordError("");
    setPasswordSuccess("");
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordForm.currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (!passwordForm.newPassword) {
      setPasswordError("Please enter a new password.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    try {
      setIsSavingPassword(true);
      const res = await API.put("/users/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      setPasswordSuccess(res.data?.message || "Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsChangingPassword(false);
    } catch (err) {
      setPasswordError(
        err.response?.data?.message ||
          "Unable to change password. Please verify your current password."
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim() !== "DELETE") {
      setDeleteError("Please type DELETE in capital letters to confirm.");
      return;
    }

    try {
      setIsDeletingAccount(true);
      setDeleteError("");

      await API.delete("/users/account");

      setIsDeleteModalOpen(false);

      if (typeof onAccountDeleted === "function") {
        onAccountDeleted();
      }
    } catch (err) {
      console.error("Account deletion failed:", err);
      setDeleteError(
        err.response?.data?.message ||
          "Unable to delete account. Please try again."
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-heading">
        <h1>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9 7 7m10 10 2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
          </svg>
          Settings
        </h1>
        <p>Manage your campus account, credentials, and preferences</p>
      </div>

      {passwordSuccess && (
        <div className="settings-alert settings-alert-success">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{passwordSuccess}</span>
          <button
            type="button"
            className="alert-dismiss-btn"
            onClick={() => setPasswordSuccess("")}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* =========================================================
          SECTION 1: ACCOUNT
         ========================================================= */}
      <div className="settings-section">
        <div className="settings-section-title">
          <span className="settings-section-badge">ACCOUNT</span>
          <h2>Account Information & Security</h2>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon-title">
              <div className="settings-icon-bubble">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h3>Profile Overview</h3>
                <p className="settings-card-subtitle">
                  Your campus identity, academic details, and personal bio
                </p>
              </div>
            </div>
            <button
              type="button"
              className="settings-action-btn settings-primary-btn"
              onClick={onNavigateToProfile}
            >
              Edit Profile
            </button>
          </div>

          <div className="settings-field-grid">
            <div className="settings-field-item">
              <span className="settings-field-label">Full Name</span>
              <span className="settings-field-value">{currentUser?.name || "Student"}</span>
            </div>
            <div className="settings-field-item">
              <span className="settings-field-label">Username</span>
              <span className="settings-field-value">
                @{currentUser?.username || currentUser?.name?.toLowerCase().replace(/\s+/g, "") || "student"}
              </span>
            </div>
            <div className="settings-field-item">
              <span className="settings-field-label">Email Address</span>
              <span className="settings-field-value">{currentUser?.email || "—"}</span>
            </div>
            <div className="settings-field-item">
              <span className="settings-field-label">College</span>
              <span className="settings-field-value">{currentUser?.college || "—"}</span>
            </div>
            {currentUser?.university && (
              <div className="settings-field-item">
                <span className="settings-field-label">University</span>
                <span className="settings-field-value">{currentUser.university}</span>
              </div>
            )}
            {currentUser?.course && (
              <div className="settings-field-item">
                <span className="settings-field-label">Course</span>
                <span className="settings-field-value">{currentUser.course}</span>
              </div>
            )}
            <div className="settings-field-item">
              <span className="settings-field-label">Branch</span>
              <span className="settings-field-value">{currentUser?.branch || "—"}</span>
            </div>
            <div className="settings-field-item">
              <span className="settings-field-label">Academic Year</span>
              <span className="settings-field-value">
                {currentUser?.year
                  ? currentUser.year.toLowerCase().includes("year")
                    ? currentUser.year
                    : `Year ${currentUser.year}`
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon-title">
              <div className="settings-icon-bubble">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <h3>Password & Authentication</h3>
                <p className="settings-card-subtitle">
                  Ensure your campus account uses a strong, secure password
                </p>
              </div>
            </div>
            {!isChangingPassword && (
              <button
                type="button"
                className="settings-action-btn settings-secondary-btn"
                onClick={() => {
                  setPasswordError("");
                  setPasswordSuccess("");
                  setIsChangingPassword(true);
                }}
              >
                Change Password
              </button>
            )}
          </div>

          {isChangingPassword ? (
            <form onSubmit={handleSavePassword} className="settings-password-form">
              {passwordError && (
                <div className="settings-inline-error">{passwordError}</div>
              )}

              <div className="settings-form-row">
                <div className="settings-form-group">
                  <label htmlFor="currentPassword">Current Password *</label>
                  <div className="password-input-wrapper">
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                    >
                      {showCurrentPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-form-row-dual">
                <div className="settings-form-group">
                  <label htmlFor="newPassword">New Password (min 6 chars) *</label>
                  <div className="password-input-wrapper">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      minLength="6"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="settings-form-group">
                  <label htmlFor="confirmPassword">Confirm New Password *</label>
                  <div className="password-input-wrapper">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Re-enter new password"
                      minLength="6"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-form-actions">
                <button
                  type="button"
                  className="settings-cancel-btn"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordError("");
                    setPasswordForm({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  disabled={isSavingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="settings-submit-btn"
                  disabled={isSavingPassword}
                >
                  {isSavingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          ) : (
            <div className="settings-password-status">
              <span className="status-indicator-dot" />
              <span>Password is set and protected with bcrypt encryption.</span>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          SECTION 2: PREFERENCES
         ========================================================= */}
      <div className="settings-section">
        <div className="settings-section-title">
          <span className="settings-section-badge">PREFERENCES</span>
          <h2>Campus Experience</h2>
        </div>

        {/* Notifications */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon-title">
              <div className="settings-icon-bubble">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div>
                <h3>Notifications</h3>
                <p className="settings-card-subtitle">
                  Activity alerts, peer messages, and event announcements
                </p>
              </div>
            </div>
            <button
              type="button"
              className="settings-action-btn settings-secondary-btn"
              onClick={onOpenNotifications}
            >
              Manage Notifications
            </button>
          </div>
          <div className="settings-preferences-info">
            <span>In-app notifications are active for posts, replies, and community updates.</span>
          </div>
        </div>

        {/* Appearance */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon-title">
              <div className="settings-icon-bubble">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </div>
              <div>
                <h3>Appearance</h3>
                <p className="settings-card-subtitle">
                  Visual theme and layout style for your campus feed
                </p>
              </div>
            </div>
            <span className="theme-active-tag">Active</span>
          </div>
          <div className="settings-theme-display">
            <div className="theme-preview-box">
              <div className="theme-swatch-purple" />
              <div className="theme-swatch-lavender" />
              <div className="theme-swatch-white" />
            </div>
            <div>
              <strong>Campus Hub Classic (Light)</strong>
              <p>
                The signature purple & lavender palette designed for optimal readability, contrast, and campus focus.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          SECTION 3: PRIVACY & SECURITY
         ========================================================= */}
      <div className="settings-section">
        <div className="settings-section-title">
          <span className="settings-section-badge">PRIVACY & SECURITY</span>
          <h2>Data Protection & Session</h2>
        </div>

        <div className="settings-card">
          <div className="settings-info-list">
            <div className="settings-info-row">
              <div className="settings-info-label-group">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <strong>Security Standard</strong>
              </div>
              <span className="settings-info-value">bcrypt 10 rounds & JWT authentication</span>
            </div>

            <div className="settings-info-row">
              <div className="settings-info-label-group">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <strong>Account Role</strong>
              </div>
              <span className="settings-info-value" style={{ textTransform: "capitalize" }}>
                {currentUser?.role || "Student"}
              </span>
            </div>

            <div className="settings-info-row">
              <div className="settings-info-label-group">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <strong>Current Active Session</strong>
              </div>
              <span className="settings-info-value">Authenticated Web Client</span>
            </div>
          </div>

          <div className="settings-session-actions">
            <div>
              <p className="session-logout-title">Sign Out of Campus Hub</p>
              <p className="session-logout-desc">
                Log out of your account on this device. You will need your password to log back in.
              </p>
            </div>
            <button
              type="button"
              className="settings-action-btn settings-secondary-btn"
              onClick={onLogout}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          SECTION 4: DANGER ZONE
         ========================================================= */}
      <div className="settings-section danger-section">
        <div className="settings-section-title">
          <span className="settings-section-badge danger-badge">DANGER ZONE</span>
          <h2>Irreversible Account Actions</h2>
        </div>

        <div className="settings-card danger-card">
          <div className="settings-card-header">
            <div>
              <h3 className="danger-title">Delete Account</h3>
              <p className="settings-card-subtitle danger-subtitle">
                Permanently delete your profile, credentials, and campus data. This action cannot be undone.
              </p>
            </div>
            <button
              type="button"
              className="settings-danger-btn"
              onClick={() => {
                setDeleteError("");
                setDeleteConfirmationText("");
                setIsDeleteModalOpen(true);
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          DELETE ACCOUNT CONFIRMATION MODAL
         ========================================================= */}
      {isDeleteModalOpen && (
        <div className="profile-modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div
            className="profile-modal-card delete-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="delete-account-title"
          >
            <div className="profile-modal-header delete-modal-header">
              <div className="delete-modal-title-wrap">
                <div className="delete-warning-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h3 id="delete-account-title">Delete Account Permanently</h3>
              </div>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => setIsDeleteModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {deleteError && (
              <div className="profile-modal-error">{deleteError}</div>
            )}

            <div className="delete-modal-body">
              <p className="delete-warning-text">
                Are you sure you want to delete your account <strong>({currentUser?.email})</strong>?
              </p>
              <p className="delete-warning-subtext">
                All your profile information, academic records, and saved items will be permanently erased.
                You will immediately be signed out and this action <strong>cannot be reversed</strong>.
              </p>

              <div className="delete-confirm-box">
                <label htmlFor="delete-confirm-input">
                  Type <strong>DELETE</strong> in all uppercase to confirm:
                </label>
                <input
                  id="delete-confirm-input"
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="profile-modal-actions delete-modal-actions">
              <button
                type="button"
                className="profile-modal-cancel"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeletingAccount}
              >
                Cancel
              </button>
              <button
                type="button"
                className="profile-modal-submit final-delete-btn"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationText.trim() !== "DELETE" || isDeletingAccount}
              >
                {isDeletingAccount ? "Deleting Account..." : "Permanently Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
