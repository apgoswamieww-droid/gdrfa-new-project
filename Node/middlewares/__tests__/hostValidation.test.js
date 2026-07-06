/**
 * Unit tests for hostValidation.js
 *
 * Covers:
 *   validateHost (default middleware from env)
 *   createHostValidator(options) factory
 *   extractHostname()
 *   parseWhitelistFromEnv()
 *
 * Scenarios:
 *   - Valid host passes through
 *   - Invalid host rejected (400)
 *   - Missing Host header (default: passthrough, rejectIfMissing: true → reject)
 *   - Port number stripped before comparison
 *   - Protocol prefix stripped in whitelist
 *   - X-Forwarded-Host header (proxied requests)
 *   - Case-insensitive matching
 *   - Multiple allowed hosts
 *   - No whitelist configured (passthrough + warning)
 *   - Custom status code and error message
 *   - CORS_ORIGIN and APP_URL fallback derivation
 */

/* ─── Mocks ────────────────────────────────────────────────────────── */

// We don't need jest.mock for external modules in these tests —
// we rely on the factory pattern (createHostValidator) to inject config.

// Store original env vars so we can restore them
const ORIGINAL_ENV = { ...process.env };

// ─── Load module under test ─────────────────────────────────────────

const {
  createHostValidator,
  extractHostname,
  parseWhitelistFromEnv,
} = require('../hostValidation');

// ─── Helpers ─────────────────────────────────────────────────────────

function mockReq(opts = {}) {
  const { host, xForwardedHost, ip } = opts;
  return {
    headers: {
      host: host || undefined,
      'x-forwarded-host': xForwardedHost || undefined,
    },
    ip: ip || '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' },
  };
}

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

beforeEach(() => {
  jest.restoreAllMocks();
  // Clear host-related env vars before each test
  delete process.env.ALLOWED_HOSTS;
  delete process.env.APP_URL;
  delete process.env.CORS_ORIGIN;
});

// ═════════════════════════════════════════════════════════════════════
//  parseWhitelistFromEnv
// ═════════════════════════════════════════════════════════════════════

describe('parseWhitelistFromEnv()', () => {
  test('parses comma-separated hostnames', () => {
    const result = parseWhitelistFromEnv('mtest.dnrd.ae, api.dnrd.ae, localhost');
    expect(result).toEqual(['mtest.dnrd.ae', 'api.dnrd.ae', 'localhost']);
  });

  test('strips https:// prefix', () => {
    const result = parseWhitelistFromEnv('https://mtest.dnrd.ae, http://api.dnrd.ae');
    expect(result).toEqual(['mtest.dnrd.ae', 'api.dnrd.ae']);
  });

  test('strips port numbers', () => {
    const result = parseWhitelistFromEnv('mtest.dnrd.ae:443, localhost:3000');
    expect(result).toEqual(['mtest.dnrd.ae', 'localhost']);
  });

  test('strips both protocol and port', () => {
    const result = parseWhitelistFromEnv('https://mtest.dnrd.ae:443');
    expect(result).toEqual(['mtest.dnrd.ae']);
  });

  test('normalizes to lowercase', () => {
    const result = parseWhitelistFromEnv('MTEST.DNRD.AE');
    expect(result).toEqual(['mtest.dnrd.ae']);
  });

  test('filters empty entries from trailing commas', () => {
    const result = parseWhitelistFromEnv('mtest.dnrd.ae, ,, localhost');
    expect(result).toEqual(['mtest.dnrd.ae', 'localhost']);
  });

  test('returns empty array for null/undefined input', () => {
    expect(parseWhitelistFromEnv(null)).toEqual([]);
    expect(parseWhitelistFromEnv(undefined)).toEqual([]);
    expect(parseWhitelistFromEnv('')).toEqual([]);
  });
});

// ═════════════════════════════════════════════════════════════════════
//  extractHostname
// ═════════════════════════════════════════════════════════════════════

describe('extractHostname()', () => {
  test('extracts hostname from Host header', () => {
    const req = mockReq({ host: 'mtest.dnrd.ae' });
    expect(extractHostname(req)).toBe('mtest.dnrd.ae');
  });

  test('strips port from Host header', () => {
    const req = mockReq({ host: 'mtest.dnrd.ae:443' });
    expect(extractHostname(req)).toBe('mtest.dnrd.ae');
  });

  test('normalizes Host header to lowercase', () => {
    const req = mockReq({ host: 'MTEST.DNRD.AE' });
    expect(extractHostname(req)).toBe('mtest.dnrd.ae');
  });

  test('prefers X-Forwarded-Host over Host header', () => {
    const req = mockReq({
      host: 'evil.com',
      xForwardedHost: 'mtest.dnrd.ae',
    });
    expect(extractHostname(req)).toBe('mtest.dnrd.ae');
  });

  test('uses first value from comma-separated X-Forwarded-Host', () => {
    const req = mockReq({
      xForwardedHost: 'mtest.dnrd.ae, proxy.fallback.com',
    });
    expect(extractHostname(req)).toBe('mtest.dnrd.ae');
  });

  test('strips port from X-Forwarded-Host', () => {
    const req = mockReq({ xForwardedHost: 'mtest.dnrd.ae:8080' });
    expect(extractHostname(req)).toBe('mtest.dnrd.ae');
  });

  test('returns null when no Host header present', () => {
    const req = mockReq({}); // no host
    expect(extractHostname(req)).toBeNull();
  });

  test('normalizes X-Forwarded-Host to lowercase', () => {
    const req = mockReq({ xForwardedHost: 'MTEST.DNRD.AE' });
    expect(extractHostname(req)).toBe('mtest.dnrd.ae');
  });
});

// ═════════════════════════════════════════════════════════════════════
//  createHostValidator – allowed hosts
// ═════════════════════════════════════════════════════════════════════

describe('createHostValidator() – allowed hosts', () => {
  test('allows request with matching hostname', () => {
    const middleware = createHostValidator({
      allowedHosts: ['mtest.dnrd.ae'],
    });
    const req = mockReq({ host: 'mtest.dnrd.ae' });
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('rejects request with unrecognized hostname (400)', () => {
    const middleware = createHostValidator({
      allowedHosts: ['mtest.dnrd.ae'],
    });
    const req = mockReq({ host: 'evil.com' });
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'Invalid Host header',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('matches host with port against port-stripped whitelist', () => {
    const middleware = createHostValidator({
      allowedHosts: ['mtest.dnrd.ae'],
    });
    const req = mockReq({ host: 'mtest.dnrd.ae:443' });
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('case-insensitive matching', () => {
    const middleware = createHostValidator({
      allowedHosts: ['mtest.dnrd.ae'],
    });
    const req = mockReq({ host: 'MTEST.DNRD.AE' });
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('supports multiple allowed hosts', () => {
    const middleware = createHostValidator({
      allowedHosts: ['mtest.dnrd.ae', 'api.dnrd.ae', 'localhost'],
    });
    const res = mockRes();

    // All three should pass
    const hosts = ['mtest.dnrd.ae', 'api.dnrd.ae', 'localhost'];
    hosts.forEach((host) => {
      const req = mockReq({ host });
      const next = jest.fn();
      middleware(req, mockRes(), next);
      expect(next).toHaveBeenCalled();
    });

    // An unknown host should fail
    const badReq = mockReq({ host: 'evil.com' });
    const badNext = jest.fn();
    middleware(badReq, res, badNext);
    expect(badNext).not.toHaveBeenCalled();
  });

  test('rejects X-Forwarded-Host when it does not match whitelist', () => {
    const middleware = createHostValidator({
      allowedHosts: ['mtest.dnrd.ae'],
    });
    const req = mockReq({
      host: 'mtest.dnrd.ae',
      xForwardedHost: 'evil.com',
    });
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════
//  createHostValidator – missing Host header
// ═════════════════════════════════════════════════════════════════════

describe('createHostValidator() – missing Host header', () => {
  test('allows request when Host header is missing (default)', () => {
    const middleware = createHostValidator({
      allowedHosts: ['mtest.dnrd.ae'],
    });
    const req = mockReq({}); // no host
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('rejects request when Host header missing and rejectIfMissing=true', () => {
    const middleware = createHostValidator({
      allowedHosts: ['mtest.dnrd.ae'],
      rejectIfMissing: true,
    });
    const req = mockReq({}); // no host
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'Invalid Host header',
    });
    expect(next).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════
//  createHostValidator – custom options
// ═════════════════════════════════════════════════════════════════════

describe('createHostValidator() – custom options', () => {
  test('accepts custom status code', () => {
    const middleware = createHostValidator({
      allowedHosts: ['mtest.dnrd.ae'],
      statusCode: 403,
    });
    const req = mockReq({ host: 'evil.com' });
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('accepts custom error message', () => {
    const middleware = createHostValidator({
      allowedHosts: ['mtest.dnrd.ae'],
      errorMessage: 'Access denied: unknown host',
    });
    const req = mockReq({ host: 'evil.com' });
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'Access denied: unknown host',
    });
  });
});

// ═════════════════════════════════════════════════════════════════════
//  createHostValidator – env var configuration
// ═════════════════════════════════════════════════════════════════════

describe('createHostValidator() – env var configuration', () => {
  test('reads ALLOWED_HOSTS env var when no explicit list given', () => {
    process.env.ALLOWED_HOSTS = 'mtest.dnrd.ae, api.dnrd.ae';
    // createHostValidator without allowedHosts will read from env
    const middleware = createHostValidator();
    const res = mockRes();

    // Known host passes
    const next1 = jest.fn();
    middleware(mockReq({ host: 'mtest.dnrd.ae' }), res, next1);
    expect(next1).toHaveBeenCalled();

    // Unknown host fails
    const next2 = jest.fn();
    middleware(mockReq({ host: 'evil.com' }), res, next2);
    expect(next2).not.toHaveBeenCalled();
  });

  test('derives hosts from APP_URL when ALLOWED_HOSTS not set', () => {
    process.env.APP_URL = 'https://mtest.dnrd.ae';
    const middleware = createHostValidator();

    const next = jest.fn();
    middleware(mockReq({ host: 'mtest.dnrd.ae' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  test('derives hosts from CORS_ORIGIN when ALLOWED_HOSTS not set', () => {
    process.env.CORS_ORIGIN = 'https://mtest.dnrd.ae, http://localhost:3000';
    const middleware = createHostValidator();

    const next1 = jest.fn();
    middleware(mockReq({ host: 'mtest.dnrd.ae' }), mockRes(), next1);
    expect(next1).toHaveBeenCalled();

    const next2 = jest.fn();
    middleware(mockReq({ host: 'localhost' }), mockRes(), next2);
    expect(next2).toHaveBeenCalled();
  });

  test('prefers explicit allowedHosts over env vars', () => {
    process.env.ALLOWED_HOSTS = 'evil-allowed.com';
    const middleware = createHostValidator({
      allowedHosts: ['mtest.dnrd.ae'],
    });

    const next = jest.fn();
    middleware(mockReq({ host: 'mtest.dnrd.ae' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════
//  createHostValidator – no whitelist (passthrough mode)
// ═════════════════════════════════════════════════════════════════════

describe('createHostValidator() – no whitelist (development mode)', () => {
  test('passes through all requests when no whitelist is configured', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const middleware = createHostValidator(); // no allowedHosts, no env vars

    const req = mockReq({ host: 'any.host.com' });
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('No ALLOWED_HOSTS configured')
    );
    consoleSpy.mockRestore();
  });
});

// ═════════════════════════════════════════════════════════════════════
//  Integration with Express (supertest)
// ═════════════════════════════════════════════════════════════════════

describe('Express integration (supertest)', () => {
  const express = require('express');
  const request = require('supertest');

  function createTestApp(allowedHosts) {
    const app = express();
    const middleware = createHostValidator({ allowedHosts });
    app.use(middleware);
    app.get('/test', (req, res) => {
      res.json({ ok: true });
    });
    return app;
  }

  test('allows request with correct Host header', async () => {
    const app = createTestApp(['mtest.dnrd.ae']);
    await request(app)
      .get('/test')
      .set('Host', 'mtest.dnrd.ae')
      .expect(200, { ok: true });
  });

  test('rejects request with incorrect Host header', async () => {
    const app = createTestApp(['mtest.dnrd.ae']);
    await request(app)
      .get('/test')
      .set('Host', 'evil.com')
      .expect(400);
  });

  test('rejects request with malicious Host header payload', async () => {
    const app = createTestApp(['mtest.dnrd.ae']);
    // Common Host header injection payloads
    const payloads = [
      'evil.com#',
      "evil.com'",
      'evil.com<script>alert(1)</script>',
      'evil.com:80@localhost',
    ];
    for (const payload of payloads) {
      await request(app)
        .get('/test')
        .set('Host', payload)
        .expect(400);
    }
  });

  test('accepts Host header with port matching allowed host', async () => {
    const app = createTestApp(['mtest.dnrd.ae']);
    await request(app)
      .get('/test')
      .set('Host', 'mtest.dnrd.ae:8443')
      .expect(200);
  });

  test('rejects request with X-Forwarded-Host injection', async () => {
    const app = createTestApp(['mtest.dnrd.ae']);
    await request(app)
      .get('/test')
      .set('Host', 'mtest.dnrd.ae')
      .set('X-Forwarded-Host', 'evil.com')
      .expect(400);
  });

  test('handles missing Host header gracefully via unit tests (superTest auto-adds Host)', async () => {
    // The missing-Host scenario is tested in the unit tests above
    // ('allows request when Host header is missing (default)').
    // SuperTest's underlying HTTP client always adds a Host header,
    // so this edge case is better verified through mock-based tests.
    const app = createTestApp(['mtest.dnrd.ae']);
    // Just verify the server responds — the actual missing-Host
    // behavior is tested via mockReq({}) in the unit tests.
    await request(app)
      .get('/test')
      .set('Host', 'mtest.dnrd.ae')
      .expect(200);
  });
});
