'use strict';
const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../../utils/validate');
const { authenticate } = require('../../middleware/auth.middleware');
const { getAchievementsCtrl, getNotificationsCtrl, markReadCtrl } = require('./gamification.controller');

const router = Router();
router.use(authenticate);

// GET /gamification/achievements
router.get('/achievements', getAchievementsCtrl);

// GET /gamification/notifications
router.get('/notifications', getNotificationsCtrl);

// PATCH /gamification/notifications/read
router.patch(
  '/notifications/read',
  [body('ids').isArray({ min: 1 }), body('ids.*').isUUID()],
  validate,
  markReadCtrl,
);

module.exports = router;
