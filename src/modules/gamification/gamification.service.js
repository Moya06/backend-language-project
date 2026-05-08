'use strict';
const prisma = require('../../config/prisma');

// Achievement condition evaluators
const EVALUATORS = {
  streak: (user, value) => user.streakDays >= value,
  xp: (user, value) => user.xp >= value,
  modules: async (userId, value) => {
    const count = await prisma.userProgress.count({
      where: { userId, moduleId: { not: null }, activityId: null, status: 'COMPLETED' },
    });
    return count >= value;
  },
  activities: async (userId, value) => {
    const count = await prisma.userProgress.count({
      where: { userId, activityId: { not: null }, status: 'COMPLETED' },
    });
    return count >= value;
  },
};

// ── Check & unlock achievements ───────────────────────────
const checkAndUnlockAchievements = async (userId, user) => {
  const allAchievements = await prisma.achievement.findMany({ where: { isActive: true } });
  const already = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  const unlockedIds = new Set(already.map((a) => a.achievementId));

  const newlyUnlocked = [];

  for (const ach of allAchievements) {
    if (unlockedIds.has(ach.id)) continue;

    const { type, value } = ach.condition;
    const evaluator = EVALUATORS[type];
    if (!evaluator) continue;

    let met;
    if (type === 'streak' || type === 'xp') {
      met = evaluator(user, value);
    } else {
      met = await evaluator(userId, value);
    }

    if (met) {
      await prisma.$transaction([
        prisma.userAchievement.create({ data: { userId, achievementId: ach.id } }),
        prisma.user.update({ where: { id: userId }, data: { xp: { increment: ach.xpReward } } }),
        prisma.userNotification.create({
          data: {
            userId,
            type: 'achievement_unlocked',
            title: `Achievement unlocked: ${ach.title}`,
            body: ach.description,
            payload: { achievementId: ach.id, xpReward: ach.xpReward },
          },
        }),
      ]);
      newlyUnlocked.push(ach);
    }
  }

  return newlyUnlocked;
};

// ── Get all achievements (with user unlock status) ────────
const getAchievements = async (userId) => {
  const [all, userAchs] = await prisma.$transaction([
    prisma.achievement.findMany({ where: { isActive: true }, orderBy: { xpReward: 'desc' } }),
    prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    }),
  ]);

  const unlockedMap = new Map(userAchs.map((ua) => [ua.achievementId, ua.unlockedAt]));

  return all.map((a) => ({
    ...a,
    unlocked: unlockedMap.has(a.id),
    unlockedAt: unlockedMap.get(a.id) || null,
  }));
};

// ── Get user notifications ────────────────────────────────
const getNotifications = async (userId, { limit = 20, offset = 0, unreadOnly = false }) => {
  const where = { userId };
  if (unreadOnly) where.isRead = false;

  const [total, items] = await prisma.$transaction([
    prisma.userNotification.count({ where }),
    prisma.userNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
  ]);

  return { total, items };
};

// ── Mark notifications read ───────────────────────────────
const markNotificationsRead = async (userId, ids) => {
  await prisma.userNotification.updateMany({
    where: { userId, id: { in: ids } },
    data: { isRead: true },
  });
};

module.exports = { checkAndUnlockAchievements, getAchievements, getNotifications, markNotificationsRead };
