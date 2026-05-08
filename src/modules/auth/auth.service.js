'use strict';
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const prisma = require('../../config/prisma');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');

const BCRYPT_ROUNDS = 12;

// ── Register ──────────────────────────────────────────────
const register = async ({ email, username, password, displayName, nativeLanguage }) => {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      username: username.trim(),
      passwordHash,
      displayName: displayName || username,
      nativeLanguage: nativeLanguage || 'en',
    },
    select: {
      id: true, email: true, username: true, displayName: true,
      nativeLanguage: true, xp: true, level: true, streakDays: true,
      role: true, createdAt: true,
    },
  });

  const { accessToken, refreshToken } = await _issueTokens(user);
  return { user, accessToken, refreshToken };
};

// ── Login ─────────────────────────────────────────────────
const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user || !user.isActive) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }

  const safeUser = _safeUser(user);
  const { accessToken, refreshToken } = await _issueTokens(safeUser);
  return { user: safeUser, accessToken, refreshToken };
};

// ── Refresh token ─────────────────────────────────────────
const refresh = async (token) => {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    throw Object.assign(new Error('Refresh token expired or not found'), { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, username: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw Object.assign(new Error('User not found'), { status: 401 });
  }

  // Rotate — delete old, issue new
  await prisma.refreshToken.delete({ where: { token } });
  const { accessToken, refreshToken: newRefreshToken } = await _issueTokens(user);
  return { accessToken, refreshToken: newRefreshToken };
};

// ── Logout ────────────────────────────────────────────────
const logout = async (token) => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};

// ── Helpers ───────────────────────────────────────────────
const _issueTokens = async (user) => {
  const payload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const rawRefresh = randomUUID();
  const refreshToken = signRefreshToken({ sub: user.id, jti: rawRefresh });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  });

  return { accessToken, refreshToken };
};

const _safeUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  displayName: user.displayName,
  nativeLanguage: user.nativeLanguage,
  xp: user.xp,
  level: user.level,
  streakDays: user.streakDays,
  role: user.role,
  createdAt: user.createdAt,
});

module.exports = { register, login, refresh, logout };
