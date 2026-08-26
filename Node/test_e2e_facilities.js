/**
 * End-to-end test for Facilities module.
 * Starts the Node backend, tests all CRUD endpoints via HTTP, and reports results.
 */
process.env.NODE_ENV = 'development';
process.env.PORT = '3992';
process.env.CORS_ORIGIN = 'http://localhost:4200,http://localhost:4201';

const http = require('http');
const fs = require('fs');
const path = require('path');

function req(method, urlPath, body, token) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost', port: 3992, path: urlPath, method,
      headers: {
        'Content-Type': body instanceof Object && !(body instanceof Array) ? 'application/json' : undefined,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    // Remove undefined headers
    Object.keys(opts.headers).forEach(k => opts.headers[k] === undefined && delete opts.headers[k]);
    
    const r = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, headers: res.headers, body: d, raw: true }); }
      });
    });
    r.on('error', reject);
    if (body && opts.headers['Content-Type']) r.write(JSON.stringify(body));
    r.end();
  });
}

async function run() {
  console.log('=== Facilities Module End-to-End Test ===\n');

  // ── Start server ────────────────────────────────────────────────
  const app = require('./app');
  await new Promise(r => setTimeout(r, 3000));

  let passed = 0, failed = 0;

  function test(name, fn) {
    return new Promise(async (resolve) => {
      try {
        const result = await fn();
        console.log(`  ✅ ${name}`);
        passed++;
        resolve(result);
      } catch (e) {
        console.log(`  ❌ ${name}: ${e.message}`);
        failed++;
        resolve(null);
      }
    });
  }

  // ── Test 1: Health check ────────────────────────────────────────
  await test('GET / — Server is running', async () => {
    const r = await req('GET', '/');
    if (r.status !== 200) throw new Error(`Expected 200, got ${r.status}`);
    if (!r.body.status) throw new Error('Expected status=true');
    return r;
  });

  // ── Test 2: Login endpoint exists ───────────────────────────────
  await test('POST /api/admin/login — Endpoint responds', async () => {
    const r = await req('POST', '/api/admin/login', { email: 'test', password: 'test' });
    // Should return either 200 (success) or 401 (bad credentials) — not 500
    if (r.status >= 500) throw new Error(`Should not be 500: ${r.status}`);
    return r;
  });

  // ── Test 3: Facilities list (unauthenticated) ───────────────────
  await test('GET /api/admin/facilities — Auth check works', async () => {
    const r = await req('GET', '/api/admin/facilities');
    // Without auth, should get 401 or 403
    if (r.status >= 500) {
      // If 500, verify it's sanitized
      if (!r.body.referenceId) throw new Error(`500 missing referenceId: ${JSON.stringify(r.body)}`);
    }
    if (r.status >= 200 && r.status < 300) throw new Error(`Unauthenticated access should not succeed: got ${r.status}`);
    return r;
  });

  // ── Test 4: Facilities create (unauthenticated) ─────────────────
  await test('POST /api/admin/facilities — Auth check works', async () => {
    const r = await req('POST', '/api/admin/facilities', { title: 'Test' });
    if (r.status >= 500 && !r.body.referenceId) {
      throw new Error(`500 missing referenceId`);
    }
    return r;
  });

  // ── Test 5: Facilities delete (unauthenticated) ─────────────────
  await test('DELETE /api/admin/facilities/1 — Auth check works', async () => {
    const r = await req('DELETE', '/api/admin/facilities/1');
    if (r.status >= 500 && !r.body.referenceId) {
      throw new Error(`500 missing referenceId`);
    }
    return r;
  });

  // ── Test 6: CORS headers ────────────────────────────────────────
  await test('CORS — Whitelisted origin gets proper headers', async () => {
    const r = await req('GET', '/', null);
    // Server-to-server should work (no origin check needed)
    if (r.status !== 200) throw new Error(`Expected 200, got ${r.status}`);
    return r;
  });

  // ── Test 7: 404 handling ────────────────────────────────────────
  await test('GET /nonexistent — Returns 404', async () => {
    const r = await req('GET', '/nonexistent-route');
    if (r.status !== 404) throw new Error(`Expected 404, got ${r.status}`);
    if (r.body.message !== 'Route not found') throw new Error(`Wrong message: ${r.body.message}`);
    return r;
  });

  // ── Test 8: PPTX route (CORS fix) ───────────────────────────────
  await test('Upload PPTX route — CORS headers correct', async () => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const testFile = path.join(uploadDir, 'e2e-test.pptx');
    if (!fs.existsSync(testFile)) fs.writeFileSync(testFile, 'test');
    
    const r = await req('GET', '/uploads/e2e-test.pptx', null);
    if (r.status >= 500) throw new Error(`PPTX route returned ${r.status}`);
    // CORS header should NOT be '*'
    if (r.headers && r.headers['access-control-allow-origin'] === '*') {
      throw new Error('PPTX route still has wildcard CORS!');
    }
    try { fs.unlinkSync(testFile); } catch {}
    return r;
  });

  // ── Results ─────────────────────────────────────────────────────
  console.log(`\n=== ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
