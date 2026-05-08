'use strict';
const { serverError } = require('../utils/response');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('[ErrorHandler]', err);

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists`,
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }

  // JWT error surfaced as AppError
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  // Known app error with explicit status
  if (err.status) {
    return res.status(err.status).json({ success: false, message: err.message });
  }

  return serverError(res);
};

const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
};

module.exports = { errorHandler, notFoundHandler };
