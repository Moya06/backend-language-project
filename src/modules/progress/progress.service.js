'use strict';
const prisma = require('../../config/prisma');
const { checkAndUnlockAchievements } = require('../gamification/gamification.service');

// ── Complete an activity ───────────────────────────────────
const completeActivity = async (userId, { activityId, score }) => {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: { module: { include: { level: { include: { language: true } } } } },
  });
  if (!activity) throw Object.assign(new Error('Activity not found'), { status: 404 });

  const passed = score >= 60;
  const xpEarned = passed ? activity.xpReward : Math.floor(activity.xpReward * 0.3);

  // Upsert activity progress
  const existing = await prisma.userProgress.findUnique({
    where: { user_activity_progress: { userId, activityId } },
  });

  if (!existing) {
    await prisma.userProgress.create({
      data: {
        userId,
        activityId,
        moduleId: activity.moduleId,
        levelId: activity.module.levelId,
        languageId: activity.module.level.languageId,
        status: passed ? 'COMPLETED' : 'IN_PROGRESS',
        score,
        xpEarned,
        attempts: 1,
        completedAt: passed ? new Date() : null,
      },
    });
  } else {
    await prisma.userProgress.update({
      where: { user_activity_progress: { userId, activityId } },
      data: {
        attempts: { increment: 1 },
        score: score > (existing.score || 0) ? score : undefined,
        status: passed ? 'COMPLETED' : existing.status,
        xpEarned: passed ? Math.max(existing.xpEarned, xpEarned) : existing.xpEarned,
        completedAt: passed && !existing.completedAt ? new Date() : existing.completedAt,
      },
    });
  }

  // Award XP & update streak
  const user = await _updateUserXpAndStreak(userId, passed ? xpEarned : 0);

  // Update per-skill score
  if (activity.module.skillFocus) {
    await _updateSkillScore(userId, activity.module.level.languageId, activity.module.skillFocus, score);
  }

  // Check achievements
  const newAchievements = await checkAndUnlockAchievements(userId, user);

  return { xpEarned: passed ? xpEarned : 0, passed, user, newAchievements };
};

// ── Get user progress for a language ─────────────────────
const getProgress = async (userId, languageCode) => {
  const whereClause = languageCode
    ? {
        userId,
        language: { code: languageCode.toLowerCase() },
      }
    : { userId };

  const [activitiesCompleted, modulesCompleted, levelsCompleted, skillScores] = await prisma.$transaction([
    prisma.userProgress.count({
      where: { ...whereClause, activityId: { not: null }, status: 'COMPLETED' },
    }),
    prisma.userProgress.count({
      where: { ...whereClause, moduleId: { not: null }, activityId: null, status: 'COMPLETED' },
    }),
    prisma.userProgress.count({
      where: { ...whereClause, levelId: { not: null }, moduleId: null, activityId: null, status: 'COMPLETED' },
    }),
    languageCode
      ? prisma.userSkillScore.findMany({
          where: {
            userId,
            language: { code: languageCode.toLowerCase() },
          },
        })
      : Promise.resolve([]),
  ]);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, level: true, streakDays: true, lastActivityDate: true },
  });

  return { activitiesCompleted, modulesCompleted, levelsCompleted, skillScores, ...user };
};

// ── Get skill suggestions (weak skills) ───────────────────
const getSkillSuggestions = async (userId, languageCode) => {
  const language = await prisma.language.findUnique({ where: { code: languageCode.toLowerCase() } });
  if (!language) throw Object.assign(new Error('Language not found'), { status: 404 });

  const skillScores = await prisma.userSkillScore.findMany({
    where: { userId, languageId: language.id },
    orderBy: { score: 'asc' },
  });

  const weakSkills = skillScores.filter((s) => s.score < 60).slice(0, 3).map((s) => s.skill);

  if (!weakSkills.length) return { weakSkills: [], suggestions: [] };

  const suggestions = await prisma.activity.findMany({
    where: {
      isActive: true,
      module: {
        skillFocus: { in: weakSkills },
        level: { languageId: language.id },
      },
    },
    take: 10,
    orderBy: { difficultyScore: 'asc' },
    select: {
      id: true, title: true, type: true, xpReward: true, difficultyScore: true,
      module: { select: { title: true, skillFocus: true } },
    },
  });

  return { weakSkills, suggestions };
};

// ── Helpers ───────────────────────────────────────────────
const _updateUserXpAndStreak = async (userId, xpToAdd) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastActivityDate: true, streakDays: true, xp: true },
  });

  let streakUpdate = {};
  if (user.lastActivityDate) {
    const last = new Date(user.lastActivityDate);
    const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
    const diff = (today - lastDay) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streakUpdate = { streakDays: { increment: 1 } };
    } else if (diff > 1) {
      streakUpdate = { streakDays: 1 };
    }
    // diff === 0 → same day, no streak change
  } else {
    streakUpdate = { streakDays: 1 };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      xp: { increment: xpToAdd },
      lastActivityDate: now,
      ...streakUpdate,
    },
    select: { xp: true, level: true, streakDays: true },
  });

  return updated;
};

const _updateSkillScore = async (userId, languageId, skill, newScore) => {
  const existing = await prisma.userSkillScore.upsert({
    where: { userId_languageId_skill: { userId, languageId, skill } },
    update: {},
    create: { userId, languageId, skill, score: newScore },
  });

  // Exponential moving average: 70% old + 30% new
  const updated = existing.score * 0.7 + newScore * 0.3;
  await prisma.userSkillScore.update({
    where: { userId_languageId_skill: { userId, languageId, skill } },
    data: { score: updated },
  });
};

module.exports = { completeActivity, getProgress, getSkillSuggestions };
