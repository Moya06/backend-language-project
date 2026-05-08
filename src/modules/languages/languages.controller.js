'use strict';
const {
  getLanguages, getLevelsByLanguage, getLevelWithModules,
  getModuleWithActivities, getActivity,
} = require('./languages.service');
const { ok } = require('../../utils/response');

const getLanguagesCtrl = async (req, res, next) => {
  try { ok(res, await getLanguages()); } catch (err) { next(err); }
};

const getLevelsCtrl = async (req, res, next) => {
  try { ok(res, await getLevelsByLanguage(req.params.code)); } catch (err) { next(err); }
};

const getLevelCtrl = async (req, res, next) => {
  try { ok(res, await getLevelWithModules(req.params.id)); } catch (err) { next(err); }
};

const getModuleCtrl = async (req, res, next) => {
  try { ok(res, await getModuleWithActivities(req.params.id)); } catch (err) { next(err); }
};

const getActivityCtrl = async (req, res, next) => {
  try { ok(res, await getActivity(req.params.id)); } catch (err) { next(err); }
};

module.exports = { getLanguagesCtrl, getLevelsCtrl, getLevelCtrl, getModuleCtrl, getActivityCtrl };
