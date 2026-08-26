/**
 * Trusted Base URL Utility
 * ==========================
 * Provides the application's base URL from environment variables ONLY.
 * NEVER uses the Host header, preventing Host Header Injection attacks.
 *
 * Usage:
 *   const { getServerBaseUrl, getFullAssetUrl } = require('../utils/baseUrl');
 *   const baseUrl = getServerBaseUrl();
 *   const logoUrl = getFullAssetUrl('assets/images/Group.png');
 */

/**
 * Returns the trusted server base URL.
 * Reads from APP_URL env var first, falls back to a safe localhost default.
 * @returns {string} Base URL without trailing slash (e.g. "https://mtest.dnrd.ae")
 */
function getServerBaseUrl() {
  return (process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, '');
}

/**
 * Constructs a full URL for an uploaded file or asset.
 * If the path is already an absolute URL, returns it as-is.
 * @param {string} relativePath - Relative path like "uploads/images/foo.png" or full URL
 * @returns {string|null} Full URL or null if no path provided
 */
function getFullAssetUrl(relativePath) {
  if (!relativePath) return null;
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  const base = getServerBaseUrl();
  const cleanPath = relativePath.replace(/^\/+/, '');
  return `${base}/${cleanPath}`;
}

module.exports = { getServerBaseUrl, getFullAssetUrl };
