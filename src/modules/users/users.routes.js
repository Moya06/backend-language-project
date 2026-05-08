'use strict';
const { Router } = require('express');
const { body, query } = require('express-validator');
const { validate } = require('../../utils/validate');
const { authenticate, requireAdmin } = require('../../middleware/auth.middleware');
const {
  getMeController,
  updateMeController,
  changePasswordController,
  leaderboardController,
  listUsersController,
} = require('./users.controller');

const router = Router();

router.use(authenticate);

// GET /users/me
router.get('/me', getMeController);

// PATCH /users/me
router.patch(
  '/me',
  [
    body('displayName').optional().trim().isLength({ max: 50 }),
    body('avatarUrl').optional().isURL(),
    body('nativeLanguage').optional().isLength({ min: 2, max: 5 }),
  ],
  validate,
  updateMeController,
);

// POST /users/me/password
router.post(
  '/me/password',
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
  ],
  validate,
  changePasswordController,
);

// GET /users/leaderboard (public within auth)
router.get(
  '/leaderboard',
  [query('limit').optional().isInt({ min: 1, max: 100 }), query('offset').optional().isInt({ min: 0 })],
  validate,
  leaderboardController,
);

// GET /users — admin only
router.get('/', requireAdmin, listUsersController);

module.exports = router;
