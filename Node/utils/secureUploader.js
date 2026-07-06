/**
 * Secure File Upload Middleware
 * ===============================
 * Prevents Reflected XSS and other file-based attacks by:
 *
 * 1. Magic-number validation — reads the actual file bytes (buffer) to verify
 *    the file is genuinely a JPEG or PNG, rejecting files that only fake their
 *    extension or Content-Type header.
 * 2. Secure UUID-based renaming — prevents path-traversal and filename
 *    guessing by replacing the uploaded name with a UUID.
 * 3. Isolation from the web root — files are stored outside the application
 *    execution context so they cannot be executed as scripts.
 * 4. Secure file-serving middleware — sets X-Content-Type-Options: nosniff
 *    and Content-Security-Policy headers on every served file.
 *
 * Usage (upload):
 *   const secureUpload = require('../utils/secureUploader');
 *   const uploadImage = secureUpload.uploadImage('uploads/user');
 *   router.post('/profile', uploadImage, controller.updateProfile);
 *
 * Usage (serve):
 *   const { serveSecureFile } = require('../utils/secureUploader');
 *   router.get('/files/:filename', serveSecureFile('uploads'));
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ─── Allowed image magic bytes ───────────────────────────────────────
// Each entry is a Buffer of the file signature (magic number).
const ALLOWED_SIGNATURES = {
  'image/jpeg': [
    Buffer.from([0xFF, 0xD8, 0xFF]),           // JPEG SOI marker
  ],
  'image/png': [
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG signature
  ],
};

// Max bytes needed to identify any allowed type (PNG signature = 8 bytes)
const MAGIC_BYTES_NEEDED = 8;

// ─── Upload root (all upload paths are relative to this) ─────────────
const UPLOAD_ROOT = path.resolve(__dirname, '..', 'uploads');

/**
 * Check whether the provided buffer starts with a known image signature.
 * Returns the MIME type string on match, or null on mismatch.
 */
function detectImageMime(buffer) {
  for (const [mime, signatures] of Object.entries(ALLOWED_SIGNATURES)) {
    for (const sig of signatures) {
      if (buffer.length >= sig.length && sig.equals(buffer.subarray(0, sig.length))) {
        return mime;
      }
    }
  }
  return null;
}

/**
 * Generate a cryptographically secure random filename while preserving
 * the correct extension for the detected MIME type.
 */
function generateSecureFilename(mime) {
  const extMap = { 'image/jpeg': '.jpg', 'image/png': '.png' };
  const ext = extMap[mime] || '.bin';
  return crypto.randomUUID() + ext;
}

/**
 * Create a multer upload middleware that:
 * - Uses memory storage so we can inspect the buffer before writing
 * - Validates magic bytes from the buffer
 * - Writes validated files to disk with secure UUID names
 * - Rejects invalid files BEFORE they touch disk
 *
 * @param {string} uploadPath - Relative path under uploads/ (e.g. 'user', 'media')
 * @param {object} [options]
 * @param {number} [options.maxFileSize] - Max file size in bytes (default 5MB)
 * @returns {object} multer middleware instance (.single(), .array(), etc.)
 */
function uploadImage(uploadPath = 'general', options = {}) {
  const maxFileSize = options.maxFileSize || 5 * 1024 * 1024; // 5MB default

  const storage = multer.memoryStorage();

  const fileFilter = (req, file, cb) => {
    // Quick rejection for obviously wrong extensions
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
      return cb(
        Object.assign(new Error('Only .jpg, .jpeg, and .png files are allowed.'), {
          code: 'INVALID_FILE_TYPE',
        })
      );
    }
    cb(null, true);
  };

  const upload = multer({
    storage,
    limits: { fileSize: maxFileSize },
    fileFilter,
  });

  // Wrap the multer middleware to add magic-number validation AFTER multer
  // has buffered the file in memory, but BEFORE it's written to disk.
  const wrappedMiddleware = (fieldName) => {
    const multerMiddleware = upload.single(fieldName);

    return (req, res, next) => {
      multerMiddleware(req, res, (err) => {
        if (err) {
          // Multer-level error (size, filter, etc.)
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              status: false,
              message: `File too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB.`,
            });
          }
          return res.status(400).json({
            status: false,
            message: err.message,
          });
        }

        if (!req.file) {
          return next(); // No file uploaded — let the controller handle it
        }

        // ── Magic-number validation ────────────────────────────────
        const mime = detectImageMime(req.file.buffer);
        if (!mime) {
          // Dispose of the buffer (already in memory, no disk write occurred)
          req.file.buffer = null;
          return res.status(400).json({
            status: false,
            message: 'Invalid file content. Only JPEG and PNG images are allowed.',
          });
        }

        // ── Secure rename & write to disk ──────────────────────────
        const absolutePath = path.resolve(UPLOAD_ROOT, uploadPath);
        if (!fs.existsSync(absolutePath)) {
          fs.mkdirSync(absolutePath, { recursive: true });
        }

        const filename = generateSecureFilename(mime);
        const destPath = path.join(absolutePath, filename);

        try {
          fs.writeFileSync(destPath, req.file.buffer);
        } catch (writeErr) {
          console.error('[secureUploader] Failed to write file:', writeErr.message);
          return res.status(500).json({
            status: false,
            message: 'Failed to save file.',
          });
        }

        // Replace req.file properties with secure values
        req.file.filename = filename;
        req.file.path = destPath;
        req.file.mimetype = mime; // Use detected MIME, not client-supplied

        // Free the buffer now that it's on disk
        req.file.buffer = null;

        next();
      });
    };
  };

  return {
    single: (fieldName) => wrappedMiddleware(fieldName),
    // .array() and .fields() are intentionally not supported to enforce
    // the single-file validation pattern. Use multiple .single() calls instead.
    array: () => {
      throw new Error('Secure uploader does not support .array(). Use .single() for each file.');
    },
    fields: () => {
      throw new Error('Secure uploader does not support .fields(). Use .single() for each field.');
    },
  };
}

/**
 * Express middleware for serving uploaded files securely.
 *
 * Sets:
 *   X-Content-Type-Options: nosniff   – prevents MIME-type sniffing
 *   Content-Security-Policy             – restricts script/style execution
 *   Content-Disposition: inline         – displays in browser (not download)
 *   Cache-Control                        – caching policy
 *
 * @param {string} uploadPath - Subdirectory under uploads/ to serve from
 * @returns {function} Express middleware
 *
 * Usage:
 *   const { serveSecureFile } = require('../utils/secureUploader');
 *   router.get('/uploads/media/:filename', serveSecureFile('media'));
 */
function serveSecureFile(uploadPath = '') {
  return (req, res, next) => {
    const filename = req.params.filename;

    // Guard against missing or empty filename
    if (!filename || filename.trim() === '') {
      return res.status(400).json({ status: false, message: 'Filename is required.' });
    }

    // Prevent path traversal (raw `..` or directory separators in the filename)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ status: false, message: 'Invalid file path.' });
    }

    const filePath = path.resolve(UPLOAD_ROOT, uploadPath, filename);

    // Ensure the resolved path is within the allowed upload root
    if (!filePath.startsWith(UPLOAD_ROOT)) {
      return res.status(403).json({ status: false, message: 'Access denied.' });
    }

    // Check file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ status: false, message: 'File not found.' });
    }

    // ── Security headers ────────────────────────────────────────────
    // Prevent MIME-type sniffing (IE/Edge)
    res.set('X-Content-Type-Options', 'nosniff');

    // Strict CSP — no scripts or inline styles from uploaded files
    // Note: img-src 'self' assumes images are served from the same origin.
    // If behind a CDN/proxy, adjust the CSP to match the actual serving domain.
    res.set(
      'Content-Security-Policy',
      "default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'"
    );

    // Prevent framing
    res.set('X-Frame-Options', 'DENY');

    // Cache policy
    res.set('Cache-Control', 'private, max-age=86400');

    // Content-Disposition: inline for display, with sanitized filename
    const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    res.set('Content-Disposition', `inline; filename="${safeName}"`);

    // Derive MIME from extension — safe because magic bytes were already
    // validated on upload and the file is stored outside the web root
    // (an attacker cannot replace it after validation).
    const ext = path.extname(filename).toLowerCase();
    const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
    const contentType = mimeMap[ext] || 'application/octet-stream';
    res.set('Content-Type', contentType);

    // Stream the file
    const readStream = fs.createReadStream(filePath);
    readStream.on('error', (err) => {
      console.error('[serveSecureFile] Stream error:', err.message);
      if (!res.headersSent) res.status(500).end();
    });
    readStream.pipe(res);
  };
}

module.exports = {
  uploadImage,
  serveSecureFile,
  detectImageMime,
  generateSecureFilename,
};
