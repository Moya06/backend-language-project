'use strict';
const prisma = require('../../config/prisma');

// ── List languages ────────────────────────────────────────
const getLanguages = async () =>
  prisma.language.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, code: true, name: true, nativeName: true, flagEmoji: true, sortOrder: true },
  });

// ── Get levels for a language ─────────────────────────────
const getLevelsByLanguage = async (languageCode) => {
  const language = await prisma.language.findUnique({ where: { code: languageCode.toLowerCase() } });
  if (!language) throw Object.assign(new Error('Language not found'), { status: 404 });

  return prisma.level.findMany({
    where: { languageId: language.id, isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { modules: { where: { isActive: true } } } },
    },
  });
};

// ── Get a single level with its modules ───────────────────
const getLevelWithModules = async (levelId) => {
  const level = await prisma.level.findUnique({
    where: { id: levelId },
    include: {
      modules: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { activities: { where: { isActive: true } } } } },
      },
    },
  });
  if (!level) throw Object.assign(new Error('Level not found'), { status: 404 });
  return level;
};

// ── Get a module with its activities ─────────────────────
const getModuleWithActivities = async (moduleId) => {
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      activities: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true, title: true, type: true, xpReward: true,
          sortOrder: true, difficultyScore: true,
        },
      },
    },
  });
  if (!mod) throw Object.assign(new Error('Module not found'), { status: 404 });
  return mod;
};

// ── Get a single activity (full content) ──────────────────
const getActivity = async (activityId) => {
  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity || !activity.isActive) throw Object.assign(new Error('Activity not found'), { status: 404 });
  return activity;
};

module.exports = { getLanguages, getLevelsByLanguage, getLevelWithModules, getModuleWithActivities, getActivity };
