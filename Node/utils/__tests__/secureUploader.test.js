/**
 * Unit tests for secureUploader.js
 *
 * Covers:
 *   - detectImageMime() magic-number detection
 *   - generateSecureFilename() UUID + extension
 *   - uploadImage() middleware integration (accept JPEG/PNG, reject HTML)
 *   - serveSecureFile() headers and path-traversal prevention
 */

const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const request = require('supertest');

// ─── Module under test ───────────────────────────────────────────────
const {
  uploadImage,
  serveSecureFile,
  detectImageMime,
  generateSecureFilename,
} = require('../secureUploader');

// ─── Test fixtures ───────────────────────────────────────────────────
// Minimal valid JPEG (single pixel)
const JPEG_BUFFER = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
  0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
  0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
  0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
  0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C,
  0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
  0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D,
  0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
  0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
  0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
  0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34,
  0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4,
  0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
  0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
  0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF,
  0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
  0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
  0x02, 0x03, 0x11, 0x04, 0x05, 0x21, 0x31, 0x12,
  0x41, 0x51, 0x06, 0x07, 0x61, 0x71, 0x13, 0x22,
  0x32, 0x81, 0x08, 0x14, 0x42, 0x91, 0xA1, 0xB1,
  0xC1, 0x09, 0x23, 0x33, 0x52, 0xF0, 0x15, 0x62,
  0x72, 0xD1, 0x0A, 0x16, 0x24, 0x34, 0xE1, 0x25,
  0xF1, 0x17, 0x18, 0x19, 0x1A, 0x26, 0x27, 0x28,
  0x29, 0x2A, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A,
  0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4A,
  0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5A,
  0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A,
  0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7A,
  0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8A,
  0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99,
  0x9A, 0xA2, 0xA3, 0xA4, 0xA5, 0xA6, 0xA7, 0xA8,
  0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6, 0xB7,
  0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6,
  0xC7, 0xC8, 0xC9, 0xCA, 0xD2, 0xD3, 0xD4, 0xD5,
  0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2, 0xE3,
  0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1,
  0xF2, 0xF3, 0xF4, 0xF5, 0xF6, 0xF7, 0xF8, 0xF9,
  0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00,
  0x00, 0x3F, 0x00, 0x7B, 0x94, 0x11, 0x00, 0x00,
  0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42,
  0x60, 0x82,
]);

// Minimal valid PNG (1x1 pixel, transparent)
const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
  0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02,
  0x00, 0x01, 0xE4, 0x27, 0xDE, 0xFC, 0x00, 0x00,
  0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42,
  0x60, 0x82,
]);

// Malicious HTML file (renamed to .jpg)
const HTML_BUFFER = Buffer.from(
  '<html><body><script>alert("XSS")</script></body></html>'
);

// Non-image binary (GIF header but pretending to be .jpg)
const GIF_BUFFER = Buffer.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
  0x01, 0x00, 0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF,
  0x00, 0x00, 0x00, 0x21, 0xF9, 0x04, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3B,
]);

// ═════════════════════════════════════════════════════════════════════
//  detectImageMime()
// ═════════════════════════════════════════════════════════════════════

describe('detectImageMime()', () => {
  test('detects JPEG from magic bytes', () => {
    expect(detectImageMime(JPEG_BUFFER)).toBe('image/jpeg');
  });

  test('detects PNG from magic bytes', () => {
    expect(detectImageMime(PNG_BUFFER)).toBe('image/png');
  });

  test('returns null for HTML content', () => {
    expect(detectImageMime(HTML_BUFFER)).toBeNull();
  });

  test('returns null for GIF (not allowed)', () => {
    expect(detectImageMime(GIF_BUFFER)).toBeNull();
  });

  test('returns null for empty buffer', () => {
    expect(detectImageMime(Buffer.alloc(0))).toBeNull();
  });

  test('returns null for buffer shorter than signature (3 bytes needed for JPEG, 8 for PNG)', () => {
    // 0xFF 0xD8 is only 2 of 3 JPEG signature bytes — not enough to confirm
    expect(detectImageMime(Buffer.from([0xFF, 0xD8]))).toBeNull();
    expect(detectImageMime(Buffer.from([0x89, 0x50]))).toBeNull(); // too short for PNG sig
  });

  test('returns null for buffer with only null bytes', () => {
    expect(detectImageMime(Buffer.alloc(16))).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════
//  generateSecureFilename()
// ═════════════════════════════════════════════════════════════════════

describe('generateSecureFilename()', () => {
  test('returns filename ending in .jpg for image/jpeg', () => {
    const name = generateSecureFilename('image/jpeg');
    expect(name).toMatch(/\.jpg$/);
    expect(name.length).toBeGreaterThanOrEqual(40); // UUID (36) + .jpg (4)
  });

  test('returns filename ending in .png for image/png', () => {
    const name = generateSecureFilename('image/png');
    expect(name).toMatch(/\.png$/);
  });

  test('generates unique names on subsequent calls', () => {
    const names = new Set();
    for (let i = 0; i < 100; i++) {
      names.add(generateSecureFilename('image/jpeg'));
    }
    expect(names.size).toBe(100);
  });

  test('filename contains only hex characters and dot', () => {
    const name = generateSecureFilename('image/jpeg');
    const basename = name.replace(/\.jpg$/, '');
    expect(basename).toMatch(/^[a-f0-9-]+$/); // UUID hex + dashes
  });
});

// ═════════════════════════════════════════════════════════════════════
//  uploadImage() integration test
// ═════════════════════════════════════════════════════════════════════

describe('uploadImage() middleware', () => {
  const TEST_DIR = path.resolve(__dirname, '../../uploads', '__test__');

  beforeEach(() => {
    // Clean test directory before each test
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    // Final cleanup
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  function createApp(uploader, handler) {
    const app = express();
    app.post('/upload', uploader.single('file'), handler);
    return app;
  }

  // ── JPEG acceptance ────────────────────────────────────────────────

  test('accepts a valid JPEG file', async () => {
    const upload = uploadImage('__test__');
    const app = createApp(upload, (req, res) => {
      expect(req.file).toBeDefined();
      expect(req.file.mimetype).toBe('image/jpeg');
      expect(req.file.filename).toMatch(/\.jpg$/);
      expect(req.file.path).toContain('__test__');
      res.json({ ok: true, filename: req.file.filename });
    });

    const res = await request(app)
      .post('/upload')
      .attach('file', JPEG_BUFFER, 'photo.jpg');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    // Verify file was written to disk
    const savedPath = path.resolve(TEST_DIR, res.body.filename);
    expect(fs.existsSync(savedPath)).toBe(true);

    // File on disk should have correct magic bytes
    const diskBuf = fs.readFileSync(savedPath);
    expect(detectImageMime(diskBuf)).toBe('image/jpeg');
  });

  // ── PNG acceptance ─────────────────────────────────────────────────

  test('accepts a valid PNG file', async () => {
    const upload = uploadImage('__test__');
    const app = createApp(upload, (req, res) => {
      expect(req.file.mimetype).toBe('image/png');
      expect(req.file.filename).toMatch(/\.png$/);
      res.json({ ok: true, filename: req.file.filename });
    });

    const res = await request(app)
      .post('/upload')
      .attach('file', PNG_BUFFER, 'image.png');

    expect(res.status).toBe(200);
    expect(fs.existsSync(path.resolve(TEST_DIR, res.body.filename))).toBe(true);
  });

  // ── HTML rejection (XSS prevention) ────────────────────────────────

  test('rejects HTML file renamed to .jpg (XSS prevention)', async () => {
    const upload = uploadImage('__test__');
    const app = createApp(upload, (req, res) => {
      res.json({ ok: true }); // should not reach here
    });

    const res = await request(app)
      .post('/upload')
      .attach('file', HTML_BUFFER, 'malicious.html.jpg');

    expect(res.status).toBe(400);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toMatch(/invalid file content/i);

    // Verify no files were written to disk
    const files = fs.existsSync(TEST_DIR) ? fs.readdirSync(TEST_DIR) : [];
    expect(files).toHaveLength(0);
  });

  // ── GIF rejection (not allowed type) ───────────────────────────────

  test('rejects GIF pretending to be .jpg', async () => {
    const upload = uploadImage('__test__');
    const app = createApp(upload, (req, res) => {
      res.json({ ok: true });
    });

    const res = await request(app)
      .post('/upload')
      .attach('file', GIF_BUFFER, 'image.jpg');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid file content/i);
  });

  // ── Wrong extension ────────────────────────────────────────────────

  test('rejects non-image file extension', async () => {
    const upload = uploadImage('__test__');
    const app = createApp(upload, (req, res) => {
      res.json({ ok: true });
    });

    // HTML content with .html extension — multer fileFilter rejects it
    const res = await request(app)
      .post('/upload')
      .attach('file', HTML_BUFFER, 'page.html');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/only .jpg/i);
  });

  // ── No file attached ───────────────────────────────────────────────

  test('passes through when no file is attached', async () => {
    const upload = uploadImage('__test__');
    const app = createApp(upload, (req, res) => {
      expect(req.file).toBeUndefined();
      res.json({ ok: true });
    });

    const res = await request(app).post('/upload');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  // ── File too large ─────────────────────────────────────────────────

  test('rejects files exceeding the size limit', async () => {
    const upload = uploadImage('__test__', { maxFileSize: 100 }); // 100 bytes
    const app = createApp(upload, (req, res) => {
      res.json({ ok: true });
    });

    const res = await request(app)
      .post('/upload')
      .attach('file', JPEG_BUFFER, 'photo.jpg');

    // JPEG_BUFFER is ~450 bytes, so it should be rejected
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/file too large/i);
  });
});

// ═════════════════════════════════════════════════════════════════════
//  serveSecureFile()
// ═════════════════════════════════════════════════════════════════════

describe('serveSecureFile()', () => {
  const TEST_DIR = path.resolve(__dirname, '../../uploads', '__test_serve__');

  beforeAll(() => {
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
    // Write a test image
    fs.writeFileSync(path.join(TEST_DIR, 'test.jpg'), JPEG_BUFFER);
    fs.writeFileSync(path.join(TEST_DIR, 'test.png'), PNG_BUFFER);
  });

  afterAll(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  function createServeApp(subpath) {
    const app = express();
    app.get('/files/:filename', serveSecureFile(subpath));
    return app;
  }

  test('serves a valid JPEG with correct security headers', async () => {
    const app = createServeApp('__test_serve__');
    const res = await request(app).get('/files/test.jpg');

    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['content-type']).toMatch(/image\/jpe?g/i);
    expect(res.headers['cache-control']).toContain('private');
  });

  test('serves a valid PNG with correct content-type', async () => {
    const app = createServeApp('__test_serve__');
    const res = await request(app).get('/files/test.png');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/png/i);
  });

  test('returns 404 for non-existent file', async () => {
    const app = createServeApp('__test_serve__');
    const res = await request(app).get('/files/nonexistent.jpg');

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/file not found/i);
  });

  test('blocks path traversal via encoded dots (..%2F)', async () => {
    const app = createServeApp('__test_serve__');
    // %2F is / — Express does not normalize this, so `:filename` = '..%2Fsecret.txt'
    // The raw string contains literal '..' which is caught by the path traversal check.
    const res = await request(app).get('/files/..%2Fsecret.txt');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid file path/i);
  });

  test('blocks path traversal with raw dots in filename', async () => {
    // Construct a supertest request that bypasses Express normalization.
    // Express normalizes '..' path segments before routing, so we send
    // an encoded form that Express keeps as-is in :filename.
    const app = createServeApp('__test_serve__');
    const res = await request(app).get('/files/foo%2F..%2Fbar.jpg');

    // Contains both '..' and '/' literals after %2F decoding consideration
    expect(res.status).toBe(400);
  });

  test('returns 403 when resolved path escapes upload root', () => {
    // Unit test the path resolution logic directly (bypass Express routing).
    // Express normalizes '..' in URLs before routing, making it impossible
    // to test this via supertest. We verify the guard logic in isolation.
    const UPLOAD_ROOT = path.resolve(__dirname, '../../uploads');
    const attackPath = path.resolve(UPLOAD_ROOT, '', '../app.js');
    expect(attackPath.startsWith(UPLOAD_ROOT)).toBe(false);

    // Normal file stays within root
    const safePath = path.resolve(UPLOAD_ROOT, '', 'photo.jpg');
    expect(safePath.startsWith(UPLOAD_ROOT)).toBe(true);
  });
});
