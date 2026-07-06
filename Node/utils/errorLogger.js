/**
 * Error Logger Utility
 * ======================
 * Provides a rotating file-based logger for error details.
 *
 * Features:
 *   - Daily log rotation (error-YYYY-MM-DD.log)
 *   - Structured JSON entries
 *   - Configurable log directory
 *   - Auto-creates the log directory if it doesn't exist
 *   - Synchronous writes (fs.appendFileSync) ensure entries are
 *     persisted before any subsequent code runs — critical for
 *     error logging before process exit.
 *
 * Usage:
 *   const { logError } = require('./utils/errorLogger');
 *   logError(error, { referenceId, req });
 */

const fs = require('fs');
const path = require('path');

// ─── Defaults ─────────────────────────────────────────────────────────

const DEFAULT_LOG_DIR = path.join(__dirname, '..', 'logs');
// ─── State (for rotation tracking) ────────────────────────────────────

let currentDate = null;

// ─── Helpers ──────────────────────────────────────────────────────────

function timestamp() {
  return new Date().toISOString();
}

function today() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Ensure the log directory exists; create it (and parents) if missing.
 */
function ensureLogDir(logDir) {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

/**
 * Get the path to today's log file.
 * Rotation is date-based: each day gets its own file (error-YYYY-MM-DD.log).
 */
function getLogFilePath(logDir) {
  const dateStr = today();
  currentDate = dateStr;
  return path.join(logDir, `error-${dateStr}.log`);
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Log an error with full context to the rotating log file.
 *
 * Uses synchronous file I/O so the log entry is guaranteed to be
 * written before the function returns.
 *
 * @param {Error|string} error - The error object or message string.
 * @param {object} [context] - Additional context about the error.
 * @param {string} [context.referenceId] - Unique tracking ID for correlating
 *        with the client response.
 * @param {object} [context.req] - The Express request object (for extracting
 *        method, URL, IP, user info).
 * @param {string} [context.level='error'] - Log level (error, warn, info).
 * @param {object} [context.extra] - Any additional data to include.
 * @param {string} [logDir] - Custom log directory
 *        (defaults to <project>/logs/).
 */
function logError(error, context = {}, logDir = DEFAULT_LOG_DIR) {
  ensureLogDir(logDir);

  const {
    referenceId = null,
    req = null,
    level = 'error',
    extra = {},
  } = context;

  // Build the log entry
  const entry = {
    timestamp: timestamp(),
    level,
    referenceId,
    error: {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    },
    request: req
      ? {
          method: req.method,
          url: req.originalUrl || req.url,
          ip: req.ip || req.connection?.remoteAddress || null,
          userId: req.user?.userDomain || req.user?.id || null,
          userAgent: req.headers?.['user-agent'] || null,
        }
      : null,
    extra,
  };

  // Remove undefined keys for cleaner output
  if (!entry.error.stack) delete entry.error.stack;
  if (!entry.error.name) delete entry.error.name;

  // ── Write to the log file (synchronous) ────────────────────────
  try {
    const logFile = getLogFilePath(logDir);
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(logFile, line, 'utf8');
  } catch (fileErr) {
    // If file logging fails, fall back to console
    console.error(
      '[errorLogger] File write failed, falling back to console:',
      fileErr.message
    );
    console.error(JSON.stringify(entry, null, 2));
  }

  // ── Also log to console in a readable format ───────────────────
  const prefix = referenceId ? `[ref:${referenceId}]` : '';
  console.error(
    `[${entry.timestamp}] ${prefix} ${entry.error.name || 'Error'}: ${entry.error.message}`
  );
  if (entry.request) {
    console.error(
      `  Request: ${entry.request.method} ${entry.request.url} (IP: ${entry.request.ip}, User: ${entry.request.userId || 'anonymous'})`
    );
  }
  if (entry.error.stack && process.env.NODE_ENV !== 'production') {
    console.error(
      `  Stack:\n${entry.error.stack.split('\n').slice(0, 10).join('\n')}`
    );
  }
}

/**
 * No-op in the synchronous implementation — included for API
 * compatibility so callers can flush before process exit.
 */
function flushAndClose() {
  // All writes are synchronous — nothing to flush.
}

/**
 * Reset internal state (useful for testing).
 */
function resetForTesting() {
  currentDate = null;
}

module.exports = {
  logError,
  flushAndClose,
  resetForTesting,
};
