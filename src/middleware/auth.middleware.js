'use strict';
const { verifyAccessToken } = require('../utils/jwt');
const { unauthorized } = require('../utils/response');

/**
 * Attach req.user from Bearer JWT.
 * Throws 401 if missing or invalid.
 */
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return unauthorized(res);
  }
  const token = header.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return unauthorized(res, 'Invalid or expired token');
  }
};

/**
 * Require the user to have the ADMIN role.
 * Must be used after authenticate.
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    const { forbidden } = require('../utils/response');
    return forbidden(res, 'Admin access required');
  }
  next();
};

module.exports = { authenticate, requireAdmin };
