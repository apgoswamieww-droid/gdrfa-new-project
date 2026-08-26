/**
 * Response Formatter Middleware
 * ===============================
 * Adds res.success(), res.error(), and res.serverError() helpers.
 *
 * Security: For statusCode >= 500, res.error() and res.serverError()
 * log the full error with a reference ID and return a generic
 * "Internal server error" message to prevent leaking SQL schema,
 * file paths, or stack traces to the client.
 */

const crypto = require('crypto');
const { logError } = require('../utils/errorLogger');

/**
 * Generate a UUID v4 reference ID for tracking errors.
 */
function generateReferenceId() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Log a server error and return a generic response with reference ID.
 * Shared by res.serverError() and res.error() for statusCode >= 500.
 */
function sendServerError(req, res, error, statusCode) {
  const referenceId = generateReferenceId();
  const err = error instanceof Error ? error : new Error(String(error));

  logError(err, {
    referenceId,
    req,
    level: statusCode >= 500 ? 'error' : 'warn',
    extra: { handler: 'serverError' },
  });

  return res.status(statusCode).json({
    status: false,
    message: 'Internal server error',
    referenceId,
    data: null
  });
}

const responseFormatter = (req, res, next) => {
  res.success = (data = {}, message = 'Success') => {
    res.status(200).json({
      status: true,
      message,
      data
    });
  };

  /**
   * Send an error response.
   * For statusCode >= 500, the error is logged with a reference ID
   * and a generic message is returned (prevents leaking SQL details,
   * file paths, or stack traces to clients).
   */
  res.error = (message = 'Error', statusCode = 400) => {
    if (statusCode >= 500) {
      return sendServerError(req, res, message, statusCode);
    }

    res.status(statusCode).json({
      status: false,
      message,
      data: null
    });
  };

  /**
   * Send a server error response with full logging and tracking.
   *
   * Use this in catch blocks instead of `res.error(error.message, 500)`
   * or `res.status(500).json({ message: error.message })`.
   *
   * Logs full error details to the rotating file, then returns
   * a generic "Internal server error" with a unique reference ID.
   *
   * @param {Error|string} error - The error object or message string
   * @param {number} [statusCode=500] - HTTP status code (default 500)
   */
  res.serverError = (error, statusCode = 500) => {
    return sendServerError(req, res, error, statusCode);
  };

  next();
};

module.exports = responseFormatter;
