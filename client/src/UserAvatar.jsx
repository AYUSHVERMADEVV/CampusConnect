import React, { useState } from "react";
import { getImageSource, getInitials } from "./imageUtils";

/**
 * Reusable Avatar component for CampusConnect users.
 * Displays profile picture if available and loads successfully;
 * otherwise gracefully falls back to user initials with brand styling.
 */
function UserAvatar({
  user,
  src,
  name,
  size,
  className = "",
  style = {},
  alt,
}) {
  const rawImage = src !== undefined ? src : user?.profilePicture || user?.avatar;
  const [prevRawImage, setPrevRawImage] = useState(rawImage);
  const [imageError, setImageError] = useState(false);

  if (prevRawImage !== rawImage) {
    setPrevRawImage(rawImage);
    setImageError(false);
  }

  const imageUrl = rawImage ? getImageSource(rawImage) : "";
  const displayName = name || user?.name || "Campus Student";
  const initials = getInitials(displayName);

  const dimensionStyle = size
    ? {
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
        minWidth: typeof size === "number" ? `${size}px` : size,
      }
    : {};

  const mergedStyle = {
    ...dimensionStyle,
    ...style,
  };

  const hasValidImage = Boolean(imageUrl && !imageError);

  return (
    <div
      className={`user-avatar-container ${className} ${hasValidImage ? "has-image" : "has-initials"}`}
      style={mergedStyle}
      title={displayName}
      aria-label={displayName}
    >
      {hasValidImage ? (
        <img
          src={imageUrl}
          alt={alt || displayName}
          className="user-avatar-img"
          onError={() => setImageError(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "50%",
            display: "block",
          }}
        />
      ) : (
        <span className="user-avatar-initials">{initials}</span>
      )}
    </div>
  );
}

export default UserAvatar;
