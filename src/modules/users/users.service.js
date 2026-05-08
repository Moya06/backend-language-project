'use strict';
const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');

// ── Get my profile ────────────────────────────────────────
const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, username: true, displayName: true,
      avatarUrl: true, nativeLanguage: true, xp: true, level: true,
      streakDays: true, lastActivityDate: true, role: true, createdAt: true,
      _count: {
        select: {
          achievements: true,
          progress: { where: { status: 'COMPLETED' } },
        },
      },
    },
  });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return user;
};

// ── Update profile ────────────────────────────────────────
const updateMe = async (userId, { displayName, avatarUrl, nativeLanguage }) => {
  return prisma.user.update({
    where: { id: userId },
    data: { displayName, avatarUrl, nativeLanguage },
    select: {
      id: true, email: true, username: true, displayName: true,
      avatarUrl: true, nativeLanguage: true, updatedAt: true,
    },
  });
};

// ── Change password ───────────────────────────────────────
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw Object.assign(new Error('Current password is incorrect'), { status: 400 });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  // Invalidate all refresh tokens
  await prisma.refreshToken.deleteMany({ where: { userId } });
};

// ── Leaderboard ───────────────────────────────────────────
const getLeaderboard = async ({ limit = 20, offset = 0 }) => {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { xp: 'desc' },
    take: Math.min(limit, 100),
    skip: offset,
    select: {
      id: true, username: true, displayName: true, avatarUrl: true,
      xp: true, level: true, streakDays: true,
    },
  });
  return users.map((u, i) => ({ rank: offset + i + 1, ...u }));
};

// ── Admin: list users ─────────────────────────────────────
const listUsers = async ({ limit = 20, offset = 0, search }) => {
  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, username: true, displayName: true,
        role: true, isActive: true, xp: true, createdAt: true,
      },
    }),
  ]);

  return { total, users, limit, offset };
};

module.exports = { getMe, updateMe, changePassword, getLeaderboard, listUsers };
