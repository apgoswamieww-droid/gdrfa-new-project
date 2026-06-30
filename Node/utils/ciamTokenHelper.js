const ciamService = require('../ciam/ciam.service');

/**
 * Attempt to refresh the CIAM access token using the stored refresh token.
 * Updates session and request headers on success.
 *
 * @param {Object} req - Express request object
 * @returns {Promise<{accessToken: string|null, refreshToken: string|null}>}
 */
async function attemptTokenRefresh(req) {
  const refreshToken =
    req.session?.admin?.refreshToken ||
    req.body?.refreshToken ||
    null;
  const accessToken =
    req.session?.admin?.accessToken ||
    (req.headers?.authorization
      ? req.headers.authorization.split(' ')[1]
      : null) ||
    null;

  if (!refreshToken || !accessToken) {
    console.warn('[CIAM Token Refresh] No refresh token or access token available');
    return { accessToken: null, refreshToken: null };
  }

  try {
    console.log('[CIAM Token Refresh] Attempting token refresh...');
    const result = await ciamService.authRefreshToken(accessToken, refreshToken);

    if (!result || result.isError || !result.value?.accessToken) {
      console.error('[CIAM Token Refresh] Refresh failed:', result?.firstError || 'Unknown error');
      return { accessToken: null, refreshToken: null };
    }

    const newAccessToken = result.value.accessToken;
    const newRefreshToken = result.value.refreshToken || refreshToken;

    // Update session with new tokens (for admin session-based routes)
    if (req.session?.admin) {
      req.session.admin.accessToken = newAccessToken;
      req.session.admin.refreshToken = newRefreshToken;
    }

    // Update request authorization header for subsequent calls
    if (req.headers) {
      req.headers.authorization = `Bearer ${newAccessToken}`;
    }

    // Also update req.user.token if available (for JWT-based routes)
    if (req.user) {
      req.user.token = newAccessToken;
    }

    console.log('[CIAM Token Refresh] Token refreshed successfully');
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (error) {
    console.error('[CIAM Token Refresh] Unexpected error:', error.message);
    return { accessToken: null, refreshToken: null };
  }
}

/**
 * Destroy admin session on terminal auth failure.
 * Used when both the original CIAM call and token refresh have failed.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} [callback] - Optional callback after destruction
 */
function destroyAdminSession(req, res, callback) {
  try {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('[Session Destroy] Error:', err.message);
        }
        if (callback) {
          callback();
        } else if (res && !res.headersSent) {
          res.redirect('/admin/login');
        }
      });
    } else {
      if (callback) callback();
    }
  } catch (error) {
    console.error('[Session Destroy] Unexpected error:', error.message);
    if (callback) callback();
  }
}

module.exports = { attemptTokenRefresh, destroyAdminSession };
