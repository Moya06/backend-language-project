'use strict';
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { PORT, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } = require('./config/env');
const { logger } = require('./middleware/logger.middleware');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const _normalize = (o = '') => o.trim().replace(/\/+$/, '');
const _configuredOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '')
  .split(',').map(_normalize).filter(Boolean);
const _allowlist = Array.from(new Set([
  ..._configuredOrigins,
  'https://frontend-language-project.vercel.app',
]));

// Module routers
const authRouter = require('./modules/auth/auth.routes');
const usersRouter = require('./modules/users/users.routes');
const languagesRouter = require('./modules/languages/languages.routes');
const { levelsRouter, modulesRouter, activitiesRouter } = require('./modules/languages/languages.routes');
const progressRouter = require('./modules/progress/progress.routes');
const gamificationRouter = require('./modules/gamification/gamification.routes');
const placementRouter = require('./modules/placement/placement.routes');
const aiRouter = require('./modules/ai/ai.routes');

const app = express();

// Required on Vercel/other reverse proxies so req.ip and rate limit behave correctly.
app.set('trust proxy', 1);

// ── Security & parsing ────────────────────────────────────
app.use(helmet());
app.use(cors({
  credentials: true,
  origin(origin, cb) {
    if (!origin) return cb(null, true); // Postman / server-to-server
    const ok = _allowlist.includes(_normalize(origin));
    cb(null, ok);
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// ── Global rate limit ─────────────────────────────────────
app.use(
  rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests' },
  }),
);

// ── Health check ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ── Routes ────────────────────────────────────────────────
const API = '/api/v1';

app.use(`${API}/auth`, authRouter);
app.use(`${API}/users`, usersRouter);
app.use(`${API}/languages`, languagesRouter);
app.use(`${API}/levels`, levelsRouter);
app.use(`${API}/modules`, modulesRouter);
app.use(`${API}/activities`, activitiesRouter);
app.use(`${API}/progress`, progressRouter);
app.use(`${API}/gamification`, gamificationRouter);
app.use(`${API}/placement`, placementRouter);
app.use(`${API}/ai`, aiRouter);

// ── 404 + Error handlers ──────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[GrammarLanguages API] Running on port ${PORT} (${process.env.NODE_ENV})`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('[GrammarLanguages API] SIGTERM received, shutting down gracefully');
    const prisma = require('./config/prisma');
    await prisma.$disconnect();
    process.exit(0);
  });
}

module.exports = app;
