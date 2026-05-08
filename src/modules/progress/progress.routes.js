'use strict';
const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../../utils/validate');
const { authenticate } = require('../../middleware/auth.middleware');
const { completeActivityCtrl, getProgressCtrl, getSuggestionsCtrl } = require('./progress.controller');

const router = Router();
router.use(authenticate);

// POST /progress/complete
router.post(
  '/complete',
  [
    body('activityId').isUUID(),
    body('score').isInt({ min: 0, max: 100 }),
  ],
  validate,
  completeActivityCtrl,
);

// GET /progress?lang=en
router.get('/', getProgressCtrl);

// GET /progress/skills/:lang/suggestions
router.get('/skills/:lang/suggestions', getSuggestionsCtrl);

module.exports = router;
