'use strict';
const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../../utils/validate');
const {
  registerController,
  loginController,
  refreshController,
  logoutController,
  getMeController,
} = require('./auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /auth/register
router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('displayName').optional().trim().isLength({ max: 50 }),
    body('nativeLanguage').optional().isLength({ min: 2, max: 5 }),
  ],
  validate,
  registerController,
);

// POST /auth/login
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  loginController,
);

// POST /auth/refresh
router.post('/refresh', refreshController);

// POST /auth/logout
router.post('/logout', logoutController);

// GET /auth/me
router.get('/me', authenticate, getMeController);

module.exports = router;
