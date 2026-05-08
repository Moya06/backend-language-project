'use strict';
const { getAchievements, getNotifications, markNotificationsRead } = require('./gamification.service');
const { ok, noContent } = require('../../utils/response');

const getAchievementsCtrl = async (req, res, next) => {
  try { ok(res, await getAchievements(req.user.sub)); } catch (err) { next(err); }
};

const getNotificationsCtrl = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    const unreadOnly = req.query.unread === 'true';
    ok(res, await getNotifications(req.user.sub, { limit, offset, unreadOnly }));
  } catch (err) { next(err); }
};

const markReadCtrl = async (req, res, next) => {
  try {
    const { ids } = req.body;
    await markNotificationsRead(req.user.sub, ids);
    return noContent(res);
  } catch (err) { next(err); }
};

module.exports = { getAchievementsCtrl, getNotificationsCtrl, markReadCtrl };
