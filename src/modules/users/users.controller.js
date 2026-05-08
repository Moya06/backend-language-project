'use strict';
const { getMe, updateMe, changePassword, getLeaderboard, listUsers } = require('./users.service');
const { ok, noContent, fail } = require('../../utils/response');

const getMeController = async (req, res, next) => {
  try {
    const data = await getMe(req.user.sub);
    return ok(res, data);
  } catch (err) { next(err); }
};

const updateMeController = async (req, res, next) => {
  try {
    const data = await updateMe(req.user.sub, req.body);
    return ok(res, data);
  } catch (err) { next(err); }
};

const changePasswordController = async (req, res, next) => {
  try {
    await changePassword(req.user.sub, req.body);
    return noContent(res);
  } catch (err) { next(err); }
};

const leaderboardController = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    const data = await getLeaderboard({ limit, offset });
    return ok(res, data);
  } catch (err) { next(err); }
};

const listUsersController = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    const data = await listUsers({ limit, offset, search: req.query.search });
    return ok(res, data);
  } catch (err) { next(err); }
};

module.exports = { getMeController, updateMeController, changePasswordController, leaderboardController, listUsersController };
