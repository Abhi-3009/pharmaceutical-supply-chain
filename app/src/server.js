const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { router: drugRoutes } = require('./routes/drugRoutes');
const { router: shipmentRoutes } = require('./routes/shipmentRoutes');
const verifyRoutes = require('./routes/verifyRoutes');
const logger = require('./utils/logger');

const app = express();
app.set('trust proxy', 1); // Trust first proxy (e.g. Minikube Ingress/docker proxy)

// Health check endpoint (Bypasses rate limiting for Kubernetes probes)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'pharma-supply-chain',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ---------------------
// Security Middleware
// ---------------------

// Helmet — sets various HTTP security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));

// CORS — allow cross-origin requests (configurable for production)
app.use(cors());

// Rate Limiting — prevent brute-force / DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 10000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Body parsing
app.use(express.json({ limit: '10kb' })); // limit body size for security
app.use(express.urlencoded({ extended: false }));

// ---------------------
// Request Logging
// ---------------------
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ---------------------
// Static Files (Frontend Dashboard)
// ---------------------
app.use(express.static(path.join(__dirname, 'public')));

// Apply rate limiting to API routes only (after static files)
app.use(limiter);

// ---------------------
// Routes
// ---------------------
app.use('/drugs', drugRoutes);
app.use('/shipments', shipmentRoutes);
app.use('/', verifyRoutes); // mounts /verify, /ledger, /health, /

// ---------------------
// 404 Handler
// ---------------------
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ---------------------
// Global Error Handler
// ---------------------
app.use((err, req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
