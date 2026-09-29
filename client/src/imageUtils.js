import API from "./api";

/**
 * Returns the proper browser-accessible URL for an image asset.
 * Reuses the existing application image URL architecture.
 * Supports absolute HTTP(S) URLs, blob URLs, data URIs, and backend-relative paths like "/uploads/...".
 */
export const getImageSource = (imageUrl) => {
  if (!imageUrl) return "";

  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("blob:") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }

  // Base API is e.g. "/api" -> baseURL.replace(/\/api\/?$/, "") is ""
  // If baseURL is full URL like "https://example.com/api", it strips "/api" and prepends base host
  const base = API.defaults.baseURL
    ? API.defaults.baseURL.replace(/\/api\/?$/, "")
    : "";

  const cleanPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${base}${cleanPath}`;
};

/**
 * Extracts 1-2 uppercase letters for user initials fallback.
 */
export const getInitials = (name) => {
  if (!name || typeof name !== "string") return "U";
  const trimmed = name.trim();
  if (!trimmed) return "U";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};
