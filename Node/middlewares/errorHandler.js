/**
 * Global Error Handler Middleware
 * =================================
 * Intercepts all unhandled errors, logs full technical details securely
 * to a rotating file, and returns only a generic, clean error response
 * with a unique tracking reference ID to the client.
 *
 * This prevents leakage of:
 *   - Internal database schemas (table names, column names, SQL syntax)
 *   - File system paths from stack traces
 *   - Framework internals and middleware details
 *   - Environment variable values
 *   - Third-party API keys or tokens in error messages
 *
 * Usage:
 *   // Must be the LAST middleware (after all routes and the 404 handler)
 *   const errorHandler = require('./middlewares/errorHandler');
 *   app.use(errorHandler);
 *
 * The middleware also installs process-level handlers for
 * unhandledRejection and uncaughtException to prevent silent crashes.
 *
 * Express 5 automatically catches rejected promises from async route
 * handlers and forwards them to this middleware.
 */

const crypto = require('crypto');
const { logError, flushAndClose } = require('../utils/errorLogger');

/**
 * Generate a UUID v4 using Node.js built-in crypto.
 * Falls back to a timestamp-based ID if crypto.randomUUID is unavailable.
 */
function generateReferenceId() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older Node.js versions
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ─── Known error type classifier ──────────────────────────────────────

/**
 * Known error types that can be safely exposed to the client with
 * appropriate status codes. All other errors are treated as internal
 * server errors and return a generic message.
 */
const KNOWN_ERROR_CLASSIFIERS = [
  // JSON parse errors from express.json() / express.urlencoded()
  {
    test: (err) => err instanceof SyntaxError && err.status === 400 && 'body' in err,
    statusCode: 400,
    clientMessage: 'Invalid request body format',
  },
  // JSON parse error from body-parser / express.json() in Express 5
  {
    test: (err) => err.type === 'entity.parse.failed',
    statusCode: 400,
    clientMessage: 'Invalid request body format',
  },
  // Multer file upload errors
  {
    test: (err) => err.name === 'MulterError',
    statusCode: 400,
    clientMessage: 'File upload error',
  },
  // express-validator validation errors
  {
    test: (err) => err.name === 'ValidationError' || Array.isArray(err.errors),
    statusCode: 422,
    clientMessage: 'Validation failed',
  },
  // Custom AppError class (if you define one later)
  {
    test: (err) => err.isOperational === true && typeof err.statusCode === 'number',
    statusCode: (err) => err.statusCode,
    clientMessage: (err) => err.clientMessage || err.message,
  },
];

/**
 * Classify an error to determine the safe status code and message
 * to return to the client. Returns null for unknown/internal errors.
 */
function classifyError(err) {
  for (const classifier of KNOWN_ERROR_CLASSIFIERS) {
    if (classifier.test(err)) {
      return {
        statusCode: typeof classifier.statusCode === 'function'
          ? classifier.statusCode(err)
          : classifier.statusCode,
        clientMessage: typeof classifier.clientMessage === 'function'
          ? classifier.clientMessage(err)
          : classifier.clientMessage,
      };
    }
  }
  return null;
}

// ─── Process-level handlers ───────────────────────────────────────────

/**
 * Install handlers for unhandled promise rejections and uncaught exceptions.
 * Call this once at startup to prevent silent crashes.
 *
 * These handlers:
 *   1. Log the full error with a reference ID
 *   2. Flush pending log writes
 *   3. Exit the process with code 1 (uncaught exceptions are unrecoverable)
 */
function installProcessHandlers() {
  // unhandledRejection — log and eventually exit
  process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    const referenceId = generateReferenceId();
    logError(error, {
      referenceId,
      level: 'fatal',
      extra: { handler: 'unhandledRejection' },
    });
    console.error(`[process] unhandledRejection [ref:${referenceId}]. Exiting.`);
    flushAndClose();
    // Give the logger 100ms to flush, then exit
    setTimeout(() => process.exit(1), 100);
  });

  // uncaughtException — log and exit immediately
  process.on('uncaughtException', (error) => {
    const referenceId = generateReferenceId();
    logError(error, {
      referenceId,
      level: 'fatal',
      extra: { handler: 'uncaughtException' },
    });
    console.error(`[process] uncaughtException [ref:${referenceId}]. Exiting.`);
    flushAndClose();
    // Exit immediately (uncaught exceptions leave the process in an unknown state)
    process.exit(1);
  });
}

// ─── Error handler factory ────────────────────────────────────────────

/**
 * Create a global error-handling middleware with optional overrides.
 *
 * @param {object} [options]
 * @param {boolean} [options.logToConsole=true] - Whether to log to console
 *        (in addition to the file logger).
 * @param {boolean} [options.includeRequestBody=false] - Whether to include
 *        the request body in the log entry (disabled by default for security).
 * @param {boolean} [options.includeRequestHeaders=false] - Whether to
 *        include request headers in the log entry (disabled by default).
 * @param {number} [options.defaultStatusCode=500] - Status code for
 *        unclassified errors.
 * @param {string} [options.defaultMessage='Internal server error'] -
 *        Message for unclassified errors.
 * @returns {function} Express error-handling middleware (err, req, res, next)
 */
function createErrorHandler(options = {}) {
  const {
    includeRequestBody = false,
    includeRequestHeaders = false,
    defaultStatusCode = 500,
    defaultMessage = 'Internal server error',
  } = options;

  return (err, req, res, _next) => {
    // Generate a unique tracking ID for this error instance
    const referenceId = generateReferenceId();

    // ── 1. Classify the error ────────────────────────────────────
    const classified = classifyError(err);
    const statusCode = classified ? classified.statusCode : defaultStatusCode;
    const clientMessage = classified ? classified.clientMessage : defaultMessage;

    // ── 2. Build request context for the log ──────────────────────
    const extra = {};
    if (includeRequestBody && req.body && typeof req.body === 'object') {
      // Sanitize sensitive fields before logging
      const sanitizedBody = { ...req.body };
      const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'apiKey', 'api_key'];
      for (const key of sensitiveKeys) {
        if (sanitizedBody[key]) sanitizedBody[key] = '[REDACTED]';
      }
      extra.body = sanitizedBody;
    }
    if (includeRequestHeaders && req.headers) {
      const sanitizedHeaders = { ...req.headers };
      if (sanitizedHeaders.authorization) sanitizedHeaders.authorization = '[REDACTED]';
      if (sanitizedHeaders.cookie) sanitizedHeaders.cookie = '[REDACTED]';
      extra.headers = sanitizedHeaders;
    }

    // ── 3. Log the full error securely to the rotating file ──────
    // The errorLogger always writes to the file AND logs to console
    // (console logging is intentional — operators need visibility
    // into errors even if file logging fails temporarily).
    logError(err, {
      referenceId,
      req,
      level: statusCode >= 500 ? 'error' : 'warn',
      extra,
    });

    // ── 4. Return generic, clean response to the client ──────────
    const responseBody = {
      status: false,
      message: clientMessage,
    };

    // Only include referenceId for internal server errors (500+)
    // to help users report issues. For client errors (4xx), the
    // clientMessage is descriptive enough.
    if (statusCode >= 500) {
      responseBody.referenceId = referenceId;
    }

    return res.status(statusCode).json(responseBody);
  };
}

// ─── Pre-built default middleware ─────────────────────────────────────
// This is the simplest usage:
//   const errorHandler = require('./middlewares/errorHandler');
//   app.use(errorHandler);
//
// Call installProcessHandlers() once at startup to catch unhandled
// promise rejections and uncaught exceptions.

const errorHandler = createErrorHandler();

module.exports = errorHandler;
module.exports.createErrorHandler = createErrorHandler;
module.exports.classifyError = classifyError;
module.exports.installProcessHandlers = installProcessHandlers;
