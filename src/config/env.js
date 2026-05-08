'use strict';
require('dotenv').config();

const required = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),

  // Database
  DATABASE_URL: required('DATABASE_URL'),

  // JWT
  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

  // AI (Phase 3 — optional)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || null,
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o',

  // Cloudflare R2 (Phase 3 — optional)
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || null,
  R2_ACCESS_KEY: process.env.R2_ACCESS_KEY || null,
  R2_SECRET_KEY: process.env.R2_SECRET_KEY || null,
  R2_BUCKET: process.env.R2_BUCKET || null,
};
