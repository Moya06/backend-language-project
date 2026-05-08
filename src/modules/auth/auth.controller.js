'use strict';
const { register, login, refresh, logout } = require('./auth.service');
const { ok, created, fail } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth.middleware');
const prisma = require('../../config/prisma');

const registerController = async (req, res, next) => {
  try {
    const result = await register(req.body);
    return created(res, result);
  } catch (err) {
    next(err);
  }
};

const loginController = async (req, res, next) => {
  try {
    const result = await login(req.body);
    return ok(res, result);
  } catch (err) {
    next(err);
  }
};

const refreshController = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return fail(res, 'refreshToken is required');
    const result = await refresh(refreshToken);
    return ok(res, result);
  } catch (err) {
    next(err);
  }
};

const logoutController = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await logout(refreshToken);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const getMeController = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: {
        id: true, email: true, username: true, displayName: true,
        avatarUrl: true, nativeLanguage: true, xp: true, level: true,
        streakDays: true, role: true, createdAt: true,
      },
    });
    if (!user) return fail(res, 'User not found', 404);
    return ok(res, user);
  } catch (err) { next(err); }
};

module.exports = { registerController, loginController, refreshController, logoutController, getMeController };
