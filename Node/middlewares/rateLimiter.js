/**
 * Rate Limiter Middleware
 *
 * Provides reusable rate limiters for different API route categories.
 * Uses express-rate-limit with a standard sliding-window approach.
 *
 * Categories:
 *   - globalLimiter  – applied to all /api routes (fallback)
 *   - authLimiter    – login / register (strict)
 *   - otpLimiter     – OTP endpoints (very strict)
 *   - passwordLimiter – forgot / reset password (strict)
 *   - publicFormLimiter – contact-us, facility-request (moderate)
 *   - adminLimiter   – admin-sensitive operations (moderate)
 */

const rateLimit = require('express-rate-limit');

// ─── Shared response handler ────────────────────────────────────────
function rateLimitExceeded(req, res) {
  const retryAfter = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);

  return res.status(429).json({
    status: false,
    message: 'Too many requests. Please try again later.',
    retryAfter,
    limit: req.rateLimit.limit,
    remaining: req.rateLimit.remaining,
    resetTime: new Date(req.rateLimit.resetTime).toISOString(),
  });
}

// ─── Global fallback (applied to all API routes) ────────────────────
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 2000,                  // 200 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitExceeded,
  keyGenerator: (req) => {
    // Use X-Forwarded-For if behind a proxy, else the IP
    return req.ip || req.connection?.remoteAddress || 'unknown';
  },
});

// ─── Auth endpoints (login / register) ──────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitExceeded,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Rate-limit by IP + optional email/username in body to prevent
    // distributed brute-force against a single known account
    const identifier = req.body?.email || req.body?.username || '';
    return `${req.ip}_${identifier}`;
  },
});

// ─── OTP endpoints (send / verify OTP) ──────────────────────────────
const otpLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 3,                   // 3 OTP requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitExceeded,
  keyGenerator: (req) => {
    const identifier = req.body?.email || req.body?.phone || '';
    return `${req.ip}_${identifier}`;
  },
});

// ─── Password reset / forgot endpoints ──────────────────────────────
const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // 5 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitExceeded,
  keyGenerator: (req) => {
    const identifier = req.body?.email || '';
    return `${req.ip}_${identifier}`;
  },
});

// ─── Public form submissions (contact-us, facility-request) ─────────
const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 submissions per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitExceeded,
});

// ─── Admin panel routes (moderate, since admins are trusted) ────────
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,                  // 300 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitExceeded,
});

module.exports = {
  globalLimiter,
  authLimiter,
  otpLimiter,
  passwordLimiter,
  publicFormLimiter,
  adminLimiter,
};
