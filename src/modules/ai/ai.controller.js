'use strict';
const { correctWriting, evaluateSpeaking, AI_ENABLED } = require('./ai.service');
const { ok } = require('../../utils/response');

const correctWritingCtrl = async (req, res, next) => {
  try {
    const result = await correctWriting(req.body);
    return ok(res, result);
  } catch (err) { next(err); }
};

const evaluateSpeakingCtrl = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Audio file required' });
    }
    const result = await evaluateSpeaking({
      audioBuffer: req.file.buffer,
      prompt: req.body.prompt,
      targetLanguage: req.body.targetLanguage,
    });
    return ok(res, result);
  } catch (err) { next(err); }
};

const statusCtrl = (req, res) => {
  ok(res, { enabled: AI_ENABLED });
};

module.exports = { correctWritingCtrl, evaluateSpeakingCtrl, statusCtrl };
