'use strict';
const prisma = require('../../config/prisma');

// CEFR score thresholds (out of 100)
const CEFR_THRESHOLDS = [
  { level: 'C2', min: 91 },
  { level: 'C1', min: 76 },
  { level: 'B2', min: 61 },
  { level: 'B1', min: 46 },
  { level: 'A2', min: 31 },
  { level: 'A1', min: 0 },
];

// ── Get test questions ────────────────────────────────────
const getTest = async (languageCode) => {
  const test = await prisma.placementTest.findFirst({
    where: { language: { code: languageCode.toLowerCase() }, isActive: true },
    include: {
      questions: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true, text: true, options: true, skill: true, cefrLevel: true, sortOrder: true,
          // Do NOT send `correct` to client
        },
      },
    },
  });
  if (!test) throw Object.assign(new Error('No placement test found for this language'), { status: 404 });
  return { testId: test.id, languageId: test.languageId, questions: test.questions };
};

// ── Submit answers & score ────────────────────────────────
const submitTest = async (userId, { testId, answers }) => {
  const test = await prisma.placementTest.findUnique({
    where: { id: testId },
    include: { questions: true },
  });
  if (!test) throw Object.assign(new Error('Test not found'), { status: 404 });

  // Score per question
  let totalCorrect = 0;
  const skillBuckets = {};
  for (const q of test.questions) {
    const userAnswer = answers[q.id];
    const correct = userAnswer === q.correct;
    if (correct) totalCorrect++;

    if (!skillBuckets[q.skill]) skillBuckets[q.skill] = { correct: 0, total: 0 };
    skillBuckets[q.skill].total++;
    if (correct) skillBuckets[q.skill].correct++;
  }

  const score = Math.round((totalCorrect / test.questions.length) * 100);
  const cefrResult = _scoreToCefr(score);
  const skillBreakdown = Object.fromEntries(
    Object.entries(skillBuckets).map(([skill, { correct, total }]) => [
      skill,
      Math.round((correct / total) * 100),
    ]),
  );

  const attempt = await prisma.placementAttempt.create({
    data: {
      userId,
      testId,
      answers,
      score,
      cefrResult,
      skillBreakdown,
    },
  });

  return { score, cefrResult, skillBreakdown, attemptId: attempt.id };
};

// ── Get latest result ─────────────────────────────────────
const getResult = async (userId, languageCode) => {
  const attempt = await prisma.placementAttempt.findFirst({
    where: {
      userId,
      test: { language: { code: languageCode.toLowerCase() } },
    },
    orderBy: { completedAt: 'desc' },
  });
  if (!attempt) throw Object.assign(new Error('No placement result found'), { status: 404 });
  return attempt;
};

// ── Helper ────────────────────────────────────────────────
const _scoreToCefr = (score) => {
  for (const { level, min } of CEFR_THRESHOLDS) {
    if (score >= min) return level;
  }
  return 'A1';
};

module.exports = { getTest, submitTest, getResult };
