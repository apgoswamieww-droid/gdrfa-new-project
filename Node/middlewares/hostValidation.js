/**
 * Host Header Validation Middleware
 * ====================================
 * Prevents Host Header Injection attacks by strictly validating the
 * incoming req.headers.host (or req.headers['x-forwarded-host']) against
 * a configurable whitelist of allowed hostnames.
 *
 * Host Header Injection allows an attacker to:
 *   - Poison password-reset links with a malicious domain
 *   - Bypass security trust decisions that rely on the Host header
 *   - Cache poisoning on shared hosting environments
 *   - SSRF via host-derived redirects
 *
 * Usage:
 *   const validateHost = require('./middlewares/hostValidation');
 *   app.use(validateHost);
 *
 * The whitelist can be configured via:
 *   1. ALLOWED_HOSTS environment variable (comma-separated)
 *   2. Passing an array to the factory: validateHost({ allowedHosts: [...] })
 *
 * If neither is provided, the middleware tries to derive allowed hosts
 * from APP_URL and CORS_ORIGIN environment variables as a fallback.
 * In all cases, if no whitelist is configured, the middleware logs a
 * warning and allows all hosts (fail-open for development only).
 */

// ─── Constants ────────────────────────────────────────────────────────

const DEFAULT_STATUS_CODE = 400;
const DEFAULT_ERROR_MESSAGE = 'Invalid Host header';

// ─── Whitelist parser ────────────────────────────────────────────────

/**
 * Parse a comma-separated host whitelist from an env var.
 * Strips protocol prefixes (http://, https://) and port numbers,
 * normalizes to lowercase, and removes empty entries.
 */
function parseWhitelistFromEnv(envValue) {
  if (!envValue || typeof envValue !== 'string') return [];
  return envValue
    .split(',')
    .map((h) => {
      let host = h.trim().toLowerCase();
      // Strip protocol prefix if present (e.g. "https://mtest.dnrd.ae:443" → "mtest.dnrd.ae")
      host = host.replace(/^https?:\/\//, '');
      // Strip port number if present
      host = host.replace(/:\d+$/, '');
      return host;
    })
    .filter(Boolean);
}

/**
 * Derive candidate hosts from APP_URL and CORS_ORIGIN env vars as a
 * development-friendly fallback when ALLOWED_HOSTS is not set.
 */
function deriveHostsFromEnv() {
  const hosts = [];

  const appUrl = process.env.APP_URL;
  if (appUrl) {
    hosts.push(...parseWhitelistFromEnv(appUrl));
  }

  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin) {
    const parsed = parseWhitelistFromEnv(corsOrigin);
    // CORS_ORIGIN may contain "*" — skip that
    parsed.forEach((h) => {
      if (h !== '*') hosts.push(h);
    });
  }

  return [...new Set(hosts)]; // deduplicate
}

// ─── Host extraction ──────────────────────────────────────────────────

/**
 * Strip the port from a hostname, handling both IPv4 (host.com:8080) and
 * IPv6 ([::1]:3000) formats correctly.
 *
 * - IPv6 literal `[::1]:3000` → `[::1]`
 * - IPv6 literal without port `[::1]` → `[::1]`
 * - IPv4 with port `host.com:8080` → `host.com`
 * - Plain hostname `host.com` → `host.com`
 */
function stripPort(host) {
  // IPv6 literal form: [::1] or [::1]:3000
  if (host.startsWith('[')) {
    const closingBracket = host.indexOf(']');
    if (closingBracket !== -1) {
      return host.slice(0, closingBracket + 1);
    }
  }
  // IPv4 or hostname — split on last colon for port
  const lastColon = host.lastIndexOf(':');
  return lastColon >= 0 ? host.slice(0, lastColon) : host;
}

/**
 * Extract the hostname from the request.
 *
 * Order of precedence:
 *   1. X-Forwarded-Host header (when trustProxy is enabled)
 *   2. Host header
 * Strips port number and normalizes to lowercase.
 */
function extractHostname(req) {
  // X-Forwarded-Host may contain multiple comma-separated hosts —
  // use the first one only
  const forwardedHost = req.headers['x-forwarded-host'];
  if (forwardedHost) {
    const firstHost = forwardedHost.split(',')[0].trim().toLowerCase();
    return stripPort(firstHost);
  }

  const hostHeader = req.headers.host;
  if (!hostHeader) return null;

  return stripPort(hostHeader).toLowerCase().trim();
}

// ─── Middleware factory ───────────────────────────────────────────────

/**
 * Create a Host header validation middleware.
 *
 * @param {object} [options]
 * @param {string[]} [options.allowedHosts] - Explicit whitelist of allowed hostnames.
 *        When omitted, reads from ALLOWED_HOSTS env var, then falls back to
 *        deriving from APP_URL and CORS_ORIGIN.
 * @param {number} [options.statusCode=400] - HTTP status code for rejected requests.
 * @param {string} [options.errorMessage='Invalid Host header'] - Error message body.
 * @param {boolean} [options.rejectIfMissing=false] - Whether to reject when no Host
 *        header is present at all (defaults to false for HTTP/1.0 compatibility).
 * @returns {function} Express middleware
 */
function createHostValidator(options = {}) {
  const {
    allowedHosts: explicitHosts,
    statusCode = DEFAULT_STATUS_CODE,
    errorMessage = DEFAULT_ERROR_MESSAGE,
    rejectIfMissing = false,
  } = options;

  // Resolve the whitelist
  let allowedHosts;

  if (explicitHosts && Array.isArray(explicitHosts) && explicitHosts.length > 0) {
    allowedHosts = explicitHosts.map((h) => h.toLowerCase().trim());
  } else {
    const envHosts = parseWhitelistFromEnv(process.env.ALLOWED_HOSTS);
    if (envHosts.length > 0) {
      allowedHosts = envHosts;
    } else {
      const derivedHosts = deriveHostsFromEnv();
      if (derivedHosts.length > 0) {
        allowedHosts = derivedHosts;
      }
    }
  }

  // If no whitelist could be resolved, warn and pass through (development mode)
  if (!allowedHosts || allowedHosts.length === 0) {
    console.warn(
      '[hostValidation] No ALLOWED_HOSTS configured — skipping Host header validation. ' +
      'Set the ALLOWED_HOSTS environment variable in production.'
    );
    // Return passthrough middleware
    return (req, res, next) => next();
  }

  const allowedSet = new Set(allowedHosts);

  console.log(
    `[hostValidation] Allowed hosts: ${[...allowedSet].join(', ')}`
  );

  // ─── The actual middleware ───────────────────────────────────────
  return (req, res, next) => {
    const hostname = extractHostname(req);

    if (!hostname) {
      if (rejectIfMissing) {
        return res.status(statusCode).json({
          status: false,
          message: errorMessage,
        });
      }
      // No Host header — let it through (rare edge case)
      return next();
    }

    if (!allowedSet.has(hostname)) {
      console.warn(
        `[hostValidation] Rejected request with Host: "${hostname}" (IP: ${req.ip || req.connection?.remoteAddress || 'unknown'})`
      );
      return res.status(statusCode).json({
        status: false,
        message: errorMessage,
      });
    }

    return next();
  };
}

// ─── Pre-built default middleware (reads from env at require-time) ─────
// This is the simplest usage: require('./middlewares/hostValidation')
// and use it directly as app.use(validateHost).
const validateHost = createHostValidator();

module.exports = validateHost;
module.exports.createHostValidator = createHostValidator;
module.exports.extractHostname = extractHostname;
module.exports.parseWhitelistFromEnv = parseWhitelistFromEnv;
