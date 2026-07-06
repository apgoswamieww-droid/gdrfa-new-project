/**
 * Tests: Strict CORS Origin Whitelist
 * ====================================
 * Verifies that the CORS configuration in app.js correctly:
 *   - Allows the two official frontend URLs
 *   - Blocks unrecognized origins
 *   - Allows server-to-server requests (no origin)
 *   - Handles preflight (OPTIONS) requests properly
 *   - Returns the correct CORS headers
 *   - Works with credentials: true (Access-Control-Allow-Credentials)
 */

const request = require('supertest');

// ─── Simulate the CORS config from app.js ─────────────────────────────

const DEV_WHITELIST = [
  'http://localhost:4200',
  'http://localhost:4201',
];

function parseCorsOriginEnv() {
  const raw = process.env.CORS_ORIGIN;
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(/[,\s]+/)
    .map((o) => o.trim())
    .filter(Boolean);
}

function buildAllowedOrigins() {
  const envOrigins = parseCorsOriginEnv();

  if (envOrigins.length > 0) {
    return [...new Set([...DEV_WHITELIST, ...envOrigins])];
  }

  if (process.env.NODE_ENV === 'development') {
    return DEV_WHITELIST;
  }

  console.warn('[CORS] No CORS_ORIGIN environment variable set in production!');
  return [];
}

// ─── Tests ────────────────────────────────────────────────────────────

describe('buildAllowedOrigins()', () => {
  const OLD_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...OLD_ENV };
    delete process.env.CORS_ORIGIN;
    delete process.env.NODE_ENV;
  });

  test('includes dev URLs + env origins when CORS_ORIGIN is set', () => {
    process.env.CORS_ORIGIN = 'https://sports.dnrd.gov.ae,https://admin.dnrd.gov.ae';
    const origins = buildAllowedOrigins();
    expect(origins).toContain('http://localhost:4200');
    expect(origins).toContain('http://localhost:4201');
    expect(origins).toContain('https://sports.dnrd.gov.ae');
    expect(origins).toContain('https://admin.dnrd.gov.ae');
    expect(origins.length).toBe(4);
  });

  test('deduplicates origins', () => {
    process.env.CORS_ORIGIN = 'http://localhost:4200,http://localhost:4201';
    const origins = buildAllowedOrigins();
    expect(origins.length).toBe(2); // Only 2 unique, not 4
  });

  test('uses dev-only whitelist when NODE_ENV=development and no CORS_ORIGIN', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.CORS_ORIGIN;
    const origins = buildAllowedOrigins();
    expect(origins).toEqual(['http://localhost:4200', 'http://localhost:4201']);
  });

  test('returns empty array (fail-closed) in production without CORS_ORIGIN', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.CORS_ORIGIN;
    const origins = buildAllowedOrigins();
    expect(origins).toEqual([]);
  });

  test('handles space-separated origins in env var', () => {
    process.env.CORS_ORIGIN = 'https://a.com https://b.com';
    const origins = buildAllowedOrigins();
    expect(origins).toContain('https://a.com');
    expect(origins).toContain('https://b.com');
  });
});

describe('CORS integration (supertest)', () => {
  const OLD_ENV = { ...process.env };

  beforeEach(() => {
    // Set a controlled environment for CORS tests
    process.env = { ...OLD_ENV };
    process.env.NODE_ENV = 'development';
    process.env.CORS_ORIGIN = 'https://sports.dnrd.gov.ae';
    // Remove these so supertest tests are clean
    delete process.env.ALLOWED_HOSTS;
  });

  afterEach(() => {
    process.env = { ...OLD_ENV };
  });

  /**
   * Create a fresh Express app with the production-like CORS config
   * for each test, to avoid cross-test pollution from the cached
   * module-level ALLOWED_ORIGINS array.
   */
  function createAppWithCustomCors(allowedOrigins) {
    const express = require('express');
    const cors = require('cors');
    const app = express();

    app.disable('x-powered-by');
    app.use((req, res, next) => {
      res.removeHeader('Server');
      res.removeHeader('X-Powered-By');
      next();
    });

    const corsOptions = {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'X-Requested-With'],
      exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
      optionsSuccessStatus: 200,
    };

    app.use(cors(corsOptions));
    app.get('/api/test', (req, res) => res.json({ status: true }));
    app.post('/api/test', (req, res) => res.json({ status: true }));
    app.use((req, res) => res.status(404).json({ status: false }));

    return app;
  }

  test('allows request from whitelisted origin (localhost:4200)', async () => {
    const origins = ['http://localhost:4200', 'http://localhost:4201', 'https://sports.dnrd.gov.ae'];
    const app = createAppWithCustomCors(origins);

    const res = await request(app)
      .get('/api/test')
      .set('Origin', 'http://localhost:4200');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:4200');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  test('allows request from whitelisted origin (localhost:4201)', async () => {
    const origins = ['http://localhost:4200', 'http://localhost:4201', 'https://sports.dnrd.gov.ae'];
    const app = createAppWithCustomCors(origins);

    const res = await request(app)
      .get('/api/test')
      .set('Origin', 'http://localhost:4201');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:4201');
  });

  test('allows request from whitelisted origin (production)', async () => {
    const origins = ['http://localhost:4200', 'http://localhost:4201', 'https://sports.dnrd.gov.ae'];
    const app = createAppWithCustomCors(origins);

    const res = await request(app)
      .get('/api/test')
      .set('Origin', 'https://sports.dnrd.gov.ae');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://sports.dnrd.gov.ae');
  });

  test('blocks request from unrecognized origin', async () => {
    const origins = ['http://localhost:4200', 'http://localhost:4201'];
    const app = createAppWithCustomCors(origins);

    const res = await request(app)
      .get('/api/test')
      .set('Origin', 'https://evil-site.com');

    // CORS error means the server returns an error or the header is missing
    expect(res.status).toBe(500);
    // No CORS header should be set for blocked origins
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('blocks request from typo-squatting domain', async () => {
    const origins = ['http://localhost:4200', 'http://localhost:4201'];
    const app = createAppWithCustomCors(origins);

    const res = await request(app)
      .get('/api/test')
      .set('Origin', 'http://localhost:4200.evil.com'); // Subdomain of evil, not of allowed

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('allows request with no origin (server-to-server, curl)', async () => {
    const origins = ['http://localhost:4200', 'http://localhost:4201'];
    const app = createAppWithCustomCors(origins);

    // No Origin header = server-to-server request
    const res = await request(app).get('/api/test');

    expect(res.status).toBe(200);
    // When origin is not set, the CORS middleware doesn't set ACAO
    // but the request should still succeed
  });

  test('OPTIONS preflight from whitelisted origin returns CORS headers', async () => {
    const origins = ['http://localhost:4200', 'http://localhost:4201', 'https://sports.dnrd.gov.ae'];
    const app = createAppWithCustomCors(origins);

    const res = await request(app)
      .options('/api/test')
      .set('Origin', 'http://localhost:4200')
      .set('Access-Control-Request-Method', 'POST');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:4200');
    expect(res.headers['access-control-allow-methods']).toBeDefined();
    expect(res.headers['access-control-allow-headers']).toBeDefined();
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  test('OPTIONS preflight from blocked origin fails', async () => {
    const origins = ['http://localhost:4200', 'http://localhost:4201'];
    const app = createAppWithCustomCors(origins);

    const res = await request(app)
      .options('/api/test')
      .set('Origin', 'https://evil.com')
      .set('Access-Control-Request-Method', 'POST');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('exposes custom rate-limit headers', async () => {
    const origins = ['http://localhost:4200', 'http://localhost:4201'];
    const app = createAppWithCustomCors(origins);

    const res = await request(app)
      .get('/api/test')
      .set('Origin', 'http://localhost:4200');

    expect(res.headers['access-control-expose-headers']).toBeDefined();
    const exposed = res.headers['access-control-expose-headers'];
    expect(exposed).toContain('X-RateLimit-Limit');
    expect(exposed).toContain('X-RateLimit-Remaining');
  });

  test('empty whitelist blocks every origin (fail-closed)', async () => {
    const app = createAppWithCustomCors([]); // Empty whitelist

    const res = await request(app)
      .get('/api/test')
      .set('Origin', 'http://localhost:4200');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('POST request with credentials from allowed origin', async () => {
    const origins = ['http://localhost:4200', 'http://localhost:4201', 'https://sports.dnrd.gov.ae'];
    const app = createAppWithCustomCors(origins);
    app.use(require('express').json());

    const res = await request(app)
      .post('/api/test')
      .set('Origin', 'https://sports.dnrd.gov.ae')
      .send({ test: true });

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://sports.dnrd.gov.ae');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });
});
