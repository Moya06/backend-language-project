'use strict';
const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../../utils/validate');
const { authenticate } = require('../../middleware/auth.middleware');
const { getTestCtrl, submitTestCtrl, getResultCtrl } = require('./placement.controller');

const router = Router();
router.use(authenticate);

// GET /placement/:lang/test
router.get('/:lang/test', getTestCtrl);

// POST /placement/submit
router.post(
  '/submit',
  [
    body('testId').isUUID(),
    body('answers').isObject(),
  ],
  validate,
  submitTestCtrl,
);

// GET /placement/:lang/result
router.get('/:lang/result', getResultCtrl);

module.exports = router;
