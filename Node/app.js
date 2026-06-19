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
const app = express();
const serverPort = Number(process.env.PORT || 3000);

// ─── Security Middleware (order matters!) ─────────────────────────────

// 1. Helmet – sets various HTTP security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    contentSecurityPolicy: false, // Disabled to allow Swagger UI and inline styles
  })
);

// 2. CORS – configure before body parsers for preflight handling
const corsOptions = {
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : true, // Allow all in dev; restrict in production
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

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

// ─── Static files (uploads only) ──────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Custom route for PPTX files
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ status: false, message: 'File not found' });
  }
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.pptx') {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.sendFile(filePath);
  }
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

// ─── API Routes with global rate limiting ────────────────────────────
const { globalLimiter } = require('./middlewares/rateLimiter');
app.use('/api', cors(corsOptions), globalLimiter, apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ status: false, message: 'Route not found' });
});

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
