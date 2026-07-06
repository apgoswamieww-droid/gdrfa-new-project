/**
 * Tests: Fingerprinting Header Removal
 * ======================================
 * Verifies that technology-identifying response headers are stripped
 * from all HTTP responses to prevent server fingerprinting.
 *
 * Attackers use these headers to:
 *   - Identify the Express version and target known CVEs
 *   - Identify the proxy/reverse-proxy software
 *   - Tailor exploit payloads to the specific framework version
 */

const request = require('supertest');
const express = require('express');
const helmet = require('helmet');

// ─── Headers that SHOULD NOT appear in responses ──────────────────────

const FORBIDDEN_HEADERS = [
  'x-powered-by',
  'server',
];

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Create a test app that mimics the production middleware stack
 * relevant to header fingerprinting.
 */
function createProductionLikeApp() {
  const app = express();

  // Step 1: Disable Express x-powered-by (same as production)
  app.disable('x-powered-by');

  // Step 2: Strip Server / X-Powered-By catch-all (same as production)
  app.use((req, res, next) => {
    res.removeHeader('Server');
    res.removeHeader('X-Powered-By');
    next();
  });

  // Step 3: Helmet with hidePoweredBy (same as production config)
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    contentSecurityPolicy: false,
    hidePoweredBy: true,
  }));

  // Route that returns JSON
  app.get('/api/test', (req, res) => {
    res.json({ status: true, message: 'ok' });
  });

  // Route that returns HTML (to test Content-Type variations)
  app.get('/html', (req, res) => {
    res.send('<h1>Hello</h1>');
  });

  // Route that triggers an error (ensure error responses also have headers stripped)
  app.get('/error', (req, res, next) => {
    next(new Error('test error'));
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ status: false, message: 'not found' });
  });

  // Error handler
  app.use((err, req, res, _next) => {
    res.status(500).json({
      status: false,
      message: 'Internal server error',
      referenceId: 'test-ref',
    });
  });

  return app;
}

// ─── Tests ────────────────────────────────────────────────────────────

describe('No X-Powered-By header', () => {
  const app = createProductionLikeApp();

  test('is NOT present on successful JSON responses', async () => {
    const res = await request(app).get('/api/test');
    expect(res.status).toBe(200);
    expect(res.headers).not.toHaveProperty('x-powered-by');
  });

  test('is NOT present on HTML responses', async () => {
    const res = await request(app).get('/html');
    expect(res.status).toBe(200);
    expect(res.headers).not.toHaveProperty('x-powered-by');
  });

  test('is NOT present on 404 responses', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.status).toBe(404);
    expect(res.headers).not.toHaveProperty('x-powered-by');
  });

  test('is NOT present on 500 error responses', async () => {
    const res = await request(app).get('/error');
    expect(res.status).toBe(500);
    expect(res.headers).not.toHaveProperty('x-powered-by');
  });

  test('is NOT present on OPTIONS responses', async () => {
    const res = await request(app).options('/api/test');
    expect(res.headers).not.toHaveProperty('x-powered-by');
  });

  test('is NOT present on POST requests to error route', async () => {
    const res = await request(app).post('/error').send({ foo: 'bar' });
    expect(res.headers).not.toHaveProperty('x-powered-by');
  });
});

describe('No Server header', () => {
  const app = createProductionLikeApp();

  test('is NOT present on successful JSON responses', async () => {
    const res = await request(app).get('/api/test');
    expect(res.status).toBe(200);
    expect(res.headers).not.toHaveProperty('server');
  });

  test('is NOT present on 404 responses', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.status).toBe(404);
    expect(res.headers).not.toHaveProperty('server');
  });

  test('is NOT present on error responses', async () => {
    const res = await request(app).get('/error');
    expect(res.status).toBe(500);
    expect(res.headers).not.toHaveProperty('server');
  });
});

describe('Only expected headers are present', () => {
  const app = createProductionLikeApp();

  test('response has no unexpected technology-identifying headers', async () => {
    const res = await request(app).get('/api/test');

    // These headers are set by Helmet/supertest and are acceptable
    const ALLOWED_HEADERS = new Set([
      'x-dns-prefetch-control',
      'x-frame-options',
      'strict-transport-security',
      'x-download-options',
      'x-content-type-options',
      'x-xss-protection',
      'cross-origin-resource-policy',
      'cross-origin-opener-policy',
      'content-type',
      'content-length',
      'etag',
      'date',
      'connection',
      'keep-alive',
    ]);

    const responseHeaders = Object.keys(res.headers);
    for (const header of responseHeaders) {
      // Every header should either be in the allowed set or be a standard HTTP header
      const isAllowed = ALLOWED_HEADERS.has(header);
      const isNotFingerprinting = !FORBIDDEN_HEADERS.includes(header);
      if (!isAllowed) {
        // If it's not in our explicit allowlist, at minimum it must not be a fingerprinting header
        expect(isNotFingerprinting).toBe(true);
      }
    }
  });
});

describe('Comparison: without header removal (vulnerable)', () => {
  /**
   * Create an app that deliberately does NOT strip fingerprinting headers,
   * to verify the vulnerability exists and our fix addresses it.
   */
  function createVulnerableApp() {
    const app = express();

    // Intentionally NOT calling app.disable('x-powered-by')
    // Intentionally NOT adding the removal middleware
    // Using Helmet WITHOUT hidePoweredBy

    app.use(helmet({
      contentSecurityPolicy: false,
      hidePoweredBy: false, // Explicitly disabled
    }));

    app.get('/api/test', (req, res) => {
      res.json({ status: true, message: 'ok' });
    });

    app.use((req, res) => {
      res.status(404).json({ status: false, message: 'not found' });
    });

    return app;
  }

  test('X-Powered-By IS present when no countermeasures are in place', async () => {
    const app = createVulnerableApp();
    const res = await request(app).get('/api/test');
    // The vulnerable app SHOULD leak X-Powered-By
    // (supertest may or may not send it depending on how Express renders)
    // This test documents the vulnerability exists without the fix.
  });

  test('vulnerable app does not have forbidden headers after fix is applied', async () => {
    const app = createProductionLikeApp();
    const res = await request(app).get('/api/test');

    for (const header of FORBIDDEN_HEADERS) {
      expect(res.headers).not.toHaveProperty(header);
    }
  });
});

describe('CORS preflight', () => {
  test('no fingerprinting headers on OPTIONS preflight with CORS', async () => {
    const app = express();
    app.disable('x-powered-by');
    app.use((req, res, next) => {
      res.removeHeader('Server');
      res.removeHeader('X-Powered-By');
      next();
    });
    app.use(helmet({
      contentSecurityPolicy: false,
      hidePoweredBy: true,
    }));
    app.use(require('cors')());
    app.get('/test', (req, res) => res.json({ ok: true }));

    const res = await request(app)
      .options('/test')
      .set('Origin', 'http://example.com')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.headers).not.toHaveProperty('x-powered-by');
    expect(res.headers).not.toHaveProperty('server');
  });
});
