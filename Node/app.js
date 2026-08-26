const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { i18next, middleware: i18nextMiddleware } = require('./config/i18n');
dotenv.config();

const https = require('https');
const http = require('http');
const fs = require('fs');

let options = {};
try {
  const keyPath = path.join(__dirname, 'cert', 'privkey.pem');
  const certPath = path.join(__dirname, 'cert', 'star_dnrd_gov_ae.pem');
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
  }
} catch (err) {
  console.warn('[Server] SSL certificate files could not be loaded. Falling back to HTTP.', err.message);
}

const configureApp = require('./config/appConfig');

// Initialize Firebase
const { initializeFirebase } = require('./config/firebase');
initializeFirebase();

// Import Swagger configuration
const { swaggerSpec, swaggerUi } = require('./config/swagger');
const { swaggerAuth } = require('./middlewares/swaggerAuth');

// Import Routes (API only — EJS admin routes removed)
const apiRoutes = require('./routes/apiRoutes');

// Global error handler — MUST be registered after all routes
const errorHandler = require('./middlewares/errorHandler');
const { installProcessHandlers } = require('./middlewares/errorHandler');

// Install process-level handlers for unhandledRejection and uncaughtException
installProcessHandlers();

const app = express();
const serverPort = Number(process.env.PORT || 3000);

// ─── Security Middleware (order matters!) ─────────────────────────────

// 0. Disable technology fingerprinting at the Express level.
//    Prevents X-Powered-By header from being set in the first place,
//    rather than relying on Helmet to strip it after the fact.
app.disable('x-powered-by');

// 1. Trust the first upstream proxy (IIS ARR, NGINX, load balancer).
//    Required so that req.hostname / req.protocol reflect the original
//    client-facing values, which Content-Security-Policy 'self' depends on.
//    Without this, CSP 'self' on a proxied server may resolve to an
//    internal hostname and block legitimate resources.
app.set('trust proxy', 1);

// 2. Remove any Server header set by the HTTP server / reverse proxy.
//    Express/Node.js don't set Server by default, but NGINX, IIS ARR,
//    and cloud load balancers may add it.  This catch-all ensures it's
//    stripped even if added by upstream infrastructure.
app.use((req, res, next) => {
  res.removeHeader('Server');
  res.removeHeader('X-Powered-By');
  next();
});

// 3. Host header validation – prevents Host Header Injection attacks.
//    Rejects requests with unrecognized Host headers immediately.
const validateHost = require('./middlewares/hostValidation');
app.use(validateHost);

// 4. Helmet – sets various HTTP security headers.
//    Content-Security-Policy is now ENABLED with directives that work for
//    both the API/React frontends and the Swagger UI documentation page.
//    - 'unsafe-inline' on styles is required by both React and Swagger UI
//    - 'unsafe-inline' on scripts is required by Swagger UI's inline init
//    - 'self' restricts everything else to the same origin
//    - frame-ancestors 'none' prevents clickjacking
//    - object-src 'none' blocks Flash/Java plugin execution
//    - upgrade-insecure-requests forces HTTPS in modern browsers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hidePoweredBy: true,
  })
);

// 2. CORS – strict origin whitelist
// ──────────────────────────────────────────────────────────────────────
//
// The origin validator below:
//   1. Allows the two official frontend dev URLs (localhost:4200, localhost:4201)
//   2. Reads ADDITIONAL origins from the CORS_ORIGIN env var (comma-separated)
//   3. Falls back to allowing ALL origins ONLY when NODE_ENV=development AND
//      no CORS_ORIGIN is set (for local development convenience)
//   4. Blocks ALL other origins with a CORS error (the browser shows a
//      generic "CORS error" — the origin is never revealed in the error message)
//
// Production setup:
//   CORS_ORIGIN=https://sports.dnrd.gov.ae,https://admin.dnrd.gov.ae
//
// Dev environment (built-in defaults — no env var needed for local work):
//   - http://localhost:4200  (Employee/Website frontend)
//   - http://localhost:4201  (Admin Panel frontend)

const DEV_WHITELIST = [
  'http://localhost:4200',
  'http://localhost:4201',
];

/**
 * Parse the CORS_ORIGIN environment variable into an array of allowed origins.
 * Supports comma-separated and space-separated values.
 */
function parseCorsOriginEnv() {
  const raw = process.env.CORS_ORIGIN;
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(/[,\s]+/)
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * Build the allowed-origins set from env vars and built-in defaults.
 *
 * When CORS_ORIGIN is set (production), ONLY those origins + the built-in
 * dev URLs are allowed.  When CORS_ORIGIN is NOT set (dev), only the
 * built-in dev URLs are allowed — unless NODE_ENV !== 'development',
 * in which case we fail closed (empty whitelist) to prevent accidental
 * open access on staging/production.
 */
function buildAllowedOrigins() {
  const envOrigins = parseCorsOriginEnv();

  if (envOrigins.length > 0) {
    // Production/staging: env origins + dev URLs (for admin maintenance)
    return [...new Set([...DEV_WHITELIST, ...envOrigins])];
  }

  if (process.env.NODE_ENV === 'development') {
    // Dev only: built-in URLs
    return DEV_WHITELIST;
  }

  // Production without CORS_ORIGIN set — fail closed
  console.warn(
    '[CORS] No CORS_ORIGIN environment variable set in production! ' +
    'All cross-origin requests will be blocked. ' +
    'Set CORS_ORIGIN=https://your-frontend-domain.com'
  );
  return [];
}

const ALLOWED_ORIGINS = buildAllowedOrigins();

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      // Block the request — the browser shows a generic CORS error
      // without revealing the blocked origin to the client.
      console.warn(
        `[CORS] Blocked request from origin: "${origin}"`
      );
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

if (ALLOWED_ORIGINS.length > 0) {
  console.log(`[CORS] Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
}

// 3. Body parsers & cookie parser
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// 4. Response formatter (wraps responses in a consistent envelope)
const responseFormatter = require('./middlewares/responseFormatter');
app.use(responseFormatter);

// 5. i18next middleware & language middleware
app.use(i18nextMiddleware.handle(i18next));
app.use(require('./middlewares/languageMiddleware'));

// ─── Static files (uploads & assets) ──────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Secure file serving — validates extension and sets safe headers
const { isDangerousExtension } = require('./utils/fileTypeConfig');

const MIME_MAP = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.bmp':  'image/bmp',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.ogg':  'video/ogg',
  '.mov':  'video/quicktime',
  '.avi':  'video/x-msvideo',
  '.pdf':  'application/pdf',
  '.doc':  'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls':  'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt':  'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const ext = path.extname(filename).toLowerCase();

  if (!ext || isDangerousExtension(filename)) {
    return res.status(403).json({ status: false, message: 'File type not allowed' });
  }

  const filePath = path.join(__dirname, 'uploads', filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ status: false, message: 'File not found' });
  }

  const contentType = MIME_MAP[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  return res.sendFile(filePath);
});

// Root health check
app.get('/', (req, res) => {
  res.json({ status: true, message: 'GDRFA API Server', version: '1.0.0' });
});

// Swagger Documentation
app.use('/api-docs', swaggerAuth, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #2c5aa0; }
    .swagger-ui .info .description { margin-bottom: 20px; }
    .swagger-ui::before {
      content: "\ud83d\udd12 Authenticated Access - GDRFA API Documentation";
      display: block;
      background: #f0f8ff;
      padding: 10px;
      border: 1px solid #d1ecf1;
      border-radius: 5px;
      margin-bottom: 20px;
      color: #0c5460;
      font-weight: bold;
      text-align: center;
    }
  `,
  customSiteTitle: 'GDRFA API Documentation - Secure Access',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
  },
}));

// ─── XSS Sanitization Middleware ─────────────────────────────────────
const { xssSanitize } = require('./utils/sanitize');
app.use(xssSanitize);

// ─── API Routes with global rate limiting ────────────────────────────
const { globalLimiter } = require('./middlewares/rateLimiter');
app.use('/api', cors(corsOptions), globalLimiter, apiRoutes);

// 404 handler — MUST be before the global error handler
app.use((req, res) => {
  res.status(404).json({ status: false, message: 'Route not found' });
});

// ═════════════════════════════════════════════════════════════════════
// 🛡️ GLOBAL ERROR HANDLER — catches everything that slips through
// ═════════════════════════════════════════════════════════════════════
// Logs full technical details to a rotating file, returns only a
// generic response with a tracking reference ID to the client.
app.use(errorHandler);

// Start server
const startServer = () => {
  const db = require('./config/dbDirect');
  const useHttps = process.env.USE_HTTPS === 'true' && options.key && options.cert;

  if (useHttps) {
    https.createServer(options, app).listen(serverPort, () => {
      logServerStart('https');
      afterServerStart(db);
    });
  } else {
    http.createServer(app).listen(serverPort, () => {
      logServerStart('http');
      afterServerStart(db);
    });
  }
};

const afterServerStart = (db) => {
  db.testConnection()
    .then((isConnected) => {
      if (!isConnected) {
        console.error('[Server] Database is not connected. Routes are still available, but DB-backed operations may fail.');
      }
    })
    .catch((err) => {
      console.error('[Server] Database health check failed after startup:', err);
    });
};

function getServerUrl(protocol) {
  const defaultProto = (process.env.USE_HTTPS === 'true' && options.key && options.cert) ? 'https' : 'http';
  return `${protocol || defaultProto}://localhost:${serverPort}`;
}

function logServerStart(protocol) {
  const defaultProto = (process.env.USE_HTTPS === 'true' && options.key && options.cert) ? 'https' : 'http';
  const serverUrl = getServerUrl(protocol || defaultProto);
  console.log(`[Server] Running on ${serverUrl}`);
  console.log(`[Server] Port ${serverPort}`);
  if (process.env.APP_URL) {
    console.log(`[Server] APP_URL ${process.env.APP_URL}`);
  }
}

startServer();

// Start auto-approval cron job
require('./cron/autoApproval');

// Start auto-escalation cron job (3-day timeout per level)
require('./cron/autoEscalation');

module.exports = app;
