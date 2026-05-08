'use strict';
const { completeActivity, getProgress, getSkillSuggestions } = require('./progress.service');
const { ok } = require('../../utils/response');

const completeActivityCtrl = async (req, res, next) => {
  try {
    const data = await completeActivity(req.user.sub, req.body);
    return ok(res, data);
  } catch (err) { next(err); }
};

const getProgressCtrl = async (req, res, next) => {
  try {
    const data = await getProgress(req.user.sub, req.query.lang);
    return ok(res, data);
  } catch (err) { next(err); }
};

const getSuggestionsCtrl = async (req, res, next) => {
  try {
    const data = await getSkillSuggestions(req.user.sub, req.params.lang);
    return ok(res, data);
  } catch (err) { next(err); }
};

module.exports = { completeActivityCtrl, getProgressCtrl, getSuggestionsCtrl };
