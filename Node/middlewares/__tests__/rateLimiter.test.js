/**
 * Unit tests for rateLimiter.js
 *
 * Covers all 6 rate limiter categories:
 *   globalLimiter, authLimiter, otpLimiter, passwordLimiter,
 *   publicFormLimiter, adminLimiter
 *
 * Tests:
 * - Exports and configuration (windowMs, max, headers)
 * - Custom keyGenerator functions (per-identifier rate limiting)
 * - rateLimitExceeded response handler (429 JSON)
 * - Express middleware integration
 */

const express = require('express');
const request = require('supertest');

// ─── Mock express-rate-limit ─────────────────────────────────────────
// Everything MUST be inside the jest.mock() callback due to Jest's
// automatic mock hoisting rules.

jest.mock('express-rate-limit', () => {
  const mockMiddleware = jest.fn((req, res, next) => {
    req.__rateLimitCount = (req.__rateLimitCount || 0) + 1;
    req.rateLimit = {
      limit: mockMiddleware.__max || 10,
      remaining: Math.max(0, (mockMiddleware.__max || 10) - req.__rateLimitCount),
      resetTime: Date.now() + (mockMiddleware.__windowMs || 900000),
    };
    next();
  });
  mockMiddleware.__handler = null;
  mockMiddleware.__max = null;
  mockMiddleware.__windowMs = null;
  mockMiddleware.__keyGen = null;

  const factory = jest.fn((options) => {
    mockMiddleware.__handler = options.handler || null;
    mockMiddleware.__max = options.max || 10;
    mockMiddleware.__windowMs = options.windowMs || 900000;
    mockMiddleware.__keyGen = options.keyGenerator || null;
    return mockMiddleware;
  });

  return factory;
});

// These are loaded AFTER the mock is registered
const rateLimit = require('express-rate-limit');
const rateLimiters = require('../rateLimiter');

// ═════════════════════════════════════════════════════════════════════
//  Exports
// ═════════════════════════════════════════════════════════════════════

describe('rateLimiter exports', () => {
  test('exports all 6 rate limiters', () => {
    ['globalLimiter', 'authLimiter', 'otpLimiter',
     'passwordLimiter', 'publicFormLimiter', 'adminLimiter'].forEach(
      (name) => expect(rateLimiters).toHaveProperty(name)
    );
  });

  test('each limiter is a middleware function', () => {
    Object.values(rateLimiters).forEach((fn) => {
      expect(typeof fn).toBe('function');
    });
  });
});

// ═════════════════════════════════════════════════════════════════════
//  Configuration – each limiter's max & windowMs
// ═════════════════════════════════════════════════════════════════════

describe('rate limiter configuration', () => {
  test('rateLimit() called 6 times (once per limiter)', () => {
    expect(rateLimit).toHaveBeenCalledTimes(6);
  });

  test('globalLimiter: max=200, windowMs=15min', () => {
    expect(rateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ max: 200, windowMs: 15 * 60 * 1000 })
    );
  });

  test('authLimiter: max=10, windowMs=15min', () => {
    expect(rateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ max: 10, windowMs: 15 * 60 * 1000 })
    );
  });

  test('otpLimiter: max=3, windowMs=1min', () => {
    expect(rateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ max: 3, windowMs: 1 * 60 * 1000 })
    );
  });

  test('passwordLimiter: max=5, windowMs=15min', () => {
    expect(rateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ max: 5, windowMs: 15 * 60 * 1000 })
    );
  });

  test('publicFormLimiter: max=10, windowMs=15min', () => {
    expect(rateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ max: 10, windowMs: 15 * 60 * 1000 })
    );
  });

  test('adminLimiter: max=300, windowMs=15min', () => {
    expect(rateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ max: 300, windowMs: 15 * 60 * 1000 })
    );
  });

  test('all limiters set standardHeaders: true', () => {
    rateLimit.mock.calls.forEach(([o]) => {
      expect(o.standardHeaders).toBe(true);
    });
  });

  test('all limiters set legacyHeaders: false', () => {
    rateLimit.mock.calls.forEach(([o]) => {
      expect(o.legacyHeaders).toBe(false);
    });
  });

  test('authLimiter sets skipSuccessfulRequests: false', () => {
    const auth = rateLimit.mock.calls.find(([o]) => o.max === 10)?.[0];
    expect(auth.skipSuccessfulRequests).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════
//  Helper to grab options by max value
// ═════════════════════════════════════════════════════════════════════

function optsByMax(max) {
  return rateLimit.mock.calls.find(([o]) => o.max === max)?.[0];
}

// ═════════════════════════════════════════════════════════════════════
//  Custom keyGenerator functions
// ═════════════════════════════════════════════════════════════════════

describe('globalLimiter keyGenerator', () => {
  const kg = () => optsByMax(200)?.keyGenerator;

  test('uses req.ip', () => {
    expect(kg()({ ip: '1.2.3.4' })).toBe('1.2.3.4');
  });

  test('falls back to connection.remoteAddress', () => {
    expect(kg()({ connection: { remoteAddress: '5.6.7.8' } })).toBe('5.6.7.8');
  });

  test('falls back to "unknown"', () => {
    expect(kg()({})).toBe('unknown');
  });
});

describe('authLimiter keyGenerator', () => {
  const kg = () => optsByMax(10)?.keyGenerator;

  test('keyGenerator is defined', () => {
    expect(kg()).toBeDefined();
  });

  test('combines IP + email', () => {
    expect(kg()({ ip: '1.1.1.1', body: { email: 'a@b.com' } })).toBe('1.1.1.1_a@b.com');
  });

  test('combines IP + username', () => {
    expect(kg()({ ip: '2.2.2.2', body: { username: 'joe' } })).toBe('2.2.2.2_joe');
  });

  test('prefers email over username', () => {
    expect(kg()({ ip: '3.3.3.3', body: { email: 'e@mail.com', username: 'u' } }))
      .toBe('3.3.3.3_e@mail.com');
  });

  test('appends empty string when no body fields', () => {
    expect(kg()({ ip: '4.4.4.4', body: {} })).toBe('4.4.4.4_');
  });

  test('handles missing body entirely', () => {
    expect(kg()({ ip: '5.5.5.5' })).toBe('5.5.5.5_');
  });
});

describe('otpLimiter keyGenerator', () => {
  const kg = () => optsByMax(3)?.keyGenerator;

  test('keyGenerator is defined', () => {
    expect(kg()).toBeDefined();
  });

  test('combines IP + email', () => {
    expect(kg()({ ip: '1.1.1.1', body: { email: 'a@b.com' } })).toBe('1.1.1.1_a@b.com');
  });

  test('combines IP + phone', () => {
    expect(kg()({ ip: '2.2.2.2', body: { phone: '+97150' } })).toBe('2.2.2.2_+97150');
  });

  test('prefers email over phone', () => {
    expect(kg()({ ip: '3.3.3.3', body: { email: 'e@m.com', phone: '+971' } }))
      .toBe('3.3.3.3_e@m.com');
  });

  test('appends empty string when no body fields', () => {
    expect(kg()({ ip: '4.4.4.4', body: {} })).toBe('4.4.4.4_');
  });
});

describe('passwordLimiter keyGenerator', () => {
  const kg = () => optsByMax(5)?.keyGenerator;

  test('keyGenerator is defined', () => {
    expect(kg()).toBeDefined();
  });

  test('combines IP + email', () => {
    expect(kg()({ ip: '1.1.1.1', body: { email: 'a@b.com' } })).toBe('1.1.1.1_a@b.com');
  });

  test('appends empty string when no email', () => {
    expect(kg()({ ip: '2.2.2.2', body: {} })).toBe('2.2.2.2_');
  });
});

describe('limiters without keyGenerator', () => {
  test('publicFormLimiter (max=10 auth fallback) and adminLimiter (max=300) have no keyGenerator', () => {
    // publicFormLimiter & adminLimiter don't define keyGenerator
    // But publicFormLimiter also has max=10, same as authLimiter.
    // So we check all limiters: exactly 2 should have no keyGenerator.
    const noKg = rateLimit.mock.calls.filter(([o]) => !o.keyGenerator);
    expect(noKg).toHaveLength(2);
  });
});

// ═════════════════════════════════════════════════════════════════════
//  rateLimitExceeded handler – custom 429 JSON response
// ═════════════════════════════════════════════════════════════════════

describe('rateLimitExceeded handler (429 response)', () => {
  const handler = rateLimit.mock.calls[0]?.[0]?.handler;

  test('handler is defined across all limiters', () => {
    expect(handler).toBeDefined();
  });

  test('all limiters share the same handler reference', () => {
    const handlers = rateLimit.mock.calls.map(([o]) => o.handler);
    const first = handlers[0];
    handlers.forEach((h) => expect(h).toBe(first));
  });

  test('returns 429 with all required JSON fields', () => {
    const t = Date.now() + 60000;
    const req = { rateLimit: { limit: 10, remaining: 0, resetTime: t } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: expect.any(Number),
      limit: 10,
      remaining: 0,
      resetTime: new Date(t).toISOString(),
    });
  });

  test('retryAfter is ~60s for 60s resetTime', () => {
    const t = Date.now() + 60000;
    const req = { rateLimit: { limit: 5, remaining: 0, resetTime: t } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    handler(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.retryAfter).toBeGreaterThanOrEqual(59);
    expect(body.retryAfter).toBeLessThanOrEqual(61);
    expect(Number.isInteger(body.retryAfter)).toBe(true);
  });

  test('retryAfter is ~120s for 120s resetTime', () => {
    const t = Date.now() + 120000;
    const req = { rateLimit: { limit: 5, remaining: 0, resetTime: t } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    handler(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.retryAfter).toBeGreaterThanOrEqual(119);
    expect(body.retryAfter).toBeLessThanOrEqual(121);
  });

  test('includes the actual limit and remaining in JSON', () => {
    const req = { rateLimit: { limit: 50, remaining: 3, resetTime: Date.now() + 30000 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    handler(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.limit).toBe(50);
    expect(body.remaining).toBe(3);
  });
});

// ═════════════════════════════════════════════════════════════════════
//  Middleware integration via supertest
// ═════════════════════════════════════════════════════════════════════

describe('middleware integration', () => {
  test('authLimiter allows requests under the limit (200)', async () => {
    const app = express();
    app.get('/test', rateLimiters.authLimiter, (req, res) => {
      res.json({ ok: true });
    });

    await request(app).get('/test').expect(200, { ok: true });
  });

  test('otpLimiter allows requests under the limit (200)', async () => {
    const app = express();
    app.get('/test', rateLimiters.otpLimiter, (req, res) => {
      res.json({ ok: true });
    });

    await request(app).get('/test').expect(200, { ok: true });
  });

  test('adminLimiter allows requests (200)', async () => {
    const app = express();
    app.get('/test', rateLimiters.adminLimiter, (req, res) => {
      res.json({ ok: true });
    });

    await request(app).get('/test').expect(200, { ok: true });
  });
});
