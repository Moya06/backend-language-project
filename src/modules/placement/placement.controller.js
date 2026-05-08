'use strict';
const { getTest, submitTest, getResult } = require('./placement.service');
const { ok } = require('../../utils/response');

const getTestCtrl = async (req, res, next) => {
  try { ok(res, await getTest(req.params.lang)); } catch (err) { next(err); }
};

const submitTestCtrl = async (req, res, next) => {
  try { ok(res, await submitTest(req.user.sub, req.body)); } catch (err) { next(err); }
};

const getResultCtrl = async (req, res, next) => {
  try { ok(res, await getResult(req.user.sub, req.params.lang)); } catch (err) { next(err); }
};

module.exports = { getTestCtrl, submitTestCtrl, getResultCtrl };
