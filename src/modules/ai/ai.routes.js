'use strict';
const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../../utils/validate');
const { authenticate } = require('../../middleware/auth.middleware');
const { correctWritingCtrl, evaluateSpeakingCtrl, statusCtrl } = require('./ai.controller');

let multer;
try {
  multer = require('multer');
} catch {
  // multer is optional — only needed for speaking endpoint
}

const router = Router();
router.use(authenticate);

// GET /ai/status
router.get('/status', statusCtrl);

// POST /ai/writing/correct
router.post(
  '/writing/correct',
  [
    body('text').trim().isLength({ min: 5, max: 2000 }),
    body('prompt').trim().isLength({ min: 3, max: 500 }),
    body('targetLanguage').trim().isLength({ min: 2, max: 5 }),
  ],
  validate,
  correctWritingCtrl,
);

// POST /ai/speaking/evaluate  (requires multer for file upload)
if (multer) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (req, file, cb) => {
      const allowed = ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav'];
      cb(null, allowed.includes(file.mimetype));
    },
  });

  router.post(
    '/speaking/evaluate',
    upload.single('audio'),
    [
      body('prompt').trim().isLength({ min: 3, max: 500 }),
      body('targetLanguage').trim().isLength({ min: 2, max: 5 }),
    ],
    validate,
    evaluateSpeakingCtrl,
  );
} else {
  router.post('/speaking/evaluate', (req, res) => {
    res.status(501).json({ success: false, message: 'Install multer to enable speaking evaluation' });
  });
}

module.exports = router;
