'use strict';
/**
 * Prisma Seed Script
 * Seeds: languages, levels, modules, activities, achievements
 * Run: npm run db:seed
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────
// SEED DATA — derived from frontend data models
// ─────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flagEmoji: '🇬🇧', sortOrder: 1 },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flagEmoji: '🇪🇸', sortOrder: 2 },
  { code: 'fr', name: 'French', nativeName: 'Français', flagEmoji: '🇫🇷', sortOrder: 3 },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flagEmoji: '🇩🇪', sortOrder: 4 },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flagEmoji: '🇧🇷', sortOrder: 5 },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flagEmoji: '🇮🇹', sortOrder: 6 },
];

const LEVELS = [
  { code: 'A1', title: 'Beginner', description: 'Basic phrases and expressions', sortOrder: 1, xpRequired: 0 },
  { code: 'A2', title: 'Elementary', description: 'Familiar topics and simple sentences', sortOrder: 2, xpRequired: 200 },
  { code: 'B1', title: 'Intermediate', description: 'Main points on familiar matters', sortOrder: 3, xpRequired: 600 },
  { code: 'B2', title: 'Upper-Intermediate', description: 'Complex texts and technical discussions', sortOrder: 4, xpRequired: 1400 },
  { code: 'C1', title: 'Advanced', description: 'Flexible and effective language use', sortOrder: 5, xpRequired: 3000 },
  { code: 'C2', title: 'Mastery', description: 'Precision and fluency across all contexts', sortOrder: 6, xpRequired: 6000 },
];

// Modules per level (skill-focused)
const MODULES_TEMPLATE = [
  { title: 'Greetings & Introductions', skillFocus: 'VOCABULARY', iconEmoji: '👋', xpReward: 20, sortOrder: 1 },
  { title: 'Numbers & Dates', skillFocus: 'VOCABULARY', iconEmoji: '🔢', xpReward: 20, sortOrder: 2 },
  { title: 'Basic Grammar', skillFocus: 'GRAMMAR', iconEmoji: '📝', xpReward: 25, sortOrder: 3 },
  { title: 'Listening Practice', skillFocus: 'LISTENING', iconEmoji: '🎧', xpReward: 30, sortOrder: 4 },
  { title: 'Speaking Basics', skillFocus: 'SPEAKING', iconEmoji: '🗣️', xpReward: 40, sortOrder: 5 },
];

// Activities per module
const ACTIVITIES_TEMPLATE = [
  {
    title: 'Multiple Choice Quiz',
    type: 'MULTIPLE_CHOICE',
    xpReward: 10,
    sortOrder: 1,
    difficultyScore: 0.3,
    content: {
      instructions: 'Choose the correct answer',
      questions: [
        { id: 'q1', text: 'What does "Hello" mean?', options: ['Hola', 'Adiós', 'Gracias', 'Por favor'], correct: 'Hola' },
        { id: 'q2', text: 'How do you say "Thank you"?', options: ['Por favor', 'Gracias', 'Hola', 'Sí'], correct: 'Gracias' },
        { id: 'q3', text: 'What is the Spanish word for "Yes"?', options: ['No', 'Sí', 'Tal vez', 'Nunca'], correct: 'Sí' },
      ],
    },
  },
  {
    title: 'Fill in the Blanks',
    type: 'FILL_BLANK',
    xpReward: 15,
    sortOrder: 2,
    difficultyScore: 0.5,
    content: {
      instructions: 'Fill in the blank with the correct word',
      sentences: [
        { id: 's1', text: 'Me llamo _____.', hint: 'Your name', answer: 'María' },
        { id: 's2', text: '¿Cómo _____ usted?', hint: 'How are you', answer: 'está' },
      ],
    },
  },
  {
    title: 'Word Matching',
    type: 'MATCHING',
    xpReward: 10,
    sortOrder: 3,
    difficultyScore: 0.4,
    content: {
      instructions: 'Match each word to its translation',
      pairs: [
        { left: 'Hello', right: 'Hola' },
        { left: 'Goodbye', right: 'Adiós' },
        { left: 'Please', right: 'Por favor' },
        { left: 'Sorry', right: 'Lo siento' },
      ],
    },
  },
];

const ACHIEVEMENTS = [
  { code: 'FIRST_STEP', title: 'First Step', description: 'Complete your first activity', iconEmoji: '🎯', xpReward: 10, condition: { type: 'activities', value: 1 } },
  { code: 'STREAK_3', title: '3-Day Streak', description: 'Study 3 days in a row', iconEmoji: '🔥', xpReward: 30, condition: { type: 'streak', value: 3 } },
  { code: 'STREAK_7', title: 'Week Warrior', description: 'Study 7 days in a row', iconEmoji: '⚡', xpReward: 100, condition: { type: 'streak', value: 7 } },
  { code: 'STREAK_30', title: 'Monthly Master', description: 'Study 30 days in a row', iconEmoji: '🏆', xpReward: 500, condition: { type: 'streak', value: 30 } },
  { code: 'XP_100', title: 'XP Hunter', description: 'Earn 100 XP', iconEmoji: '💫', xpReward: 20, condition: { type: 'xp', value: 100 } },
  { code: 'XP_500', title: 'XP Champion', description: 'Earn 500 XP', iconEmoji: '🌟', xpReward: 50, condition: { type: 'xp', value: 500 } },
  { code: 'XP_1000', title: 'XP Legend', description: 'Earn 1000 XP', iconEmoji: '👑', xpReward: 100, condition: { type: 'xp', value: 1000 } },
  { code: 'MODULES_5', title: 'Module Master', description: 'Complete 5 modules', iconEmoji: '📚', xpReward: 75, condition: { type: 'modules', value: 5 } },
  { code: 'ACTIVITIES_10', title: 'Activity Addict', description: 'Complete 10 activities', iconEmoji: '🎮', xpReward: 50, condition: { type: 'activities', value: 10 } },
  { code: 'ACTIVITIES_50', title: 'Dedicated Learner', description: 'Complete 50 activities', iconEmoji: '🎓', xpReward: 200, condition: { type: 'activities', value: 50 } },
];

// ─────────────────────────────────────────────────────────
// SEED FUNCTIONS
// ─────────────────────────────────────────────────────────

async function seedLanguages() {
  console.log('→ Seeding languages...');
  const created = [];
  for (const lang of LANGUAGES) {
    const record = await prisma.language.upsert({
      where: { code: lang.code },
      update: lang,
      create: lang,
    });
    created.push(record);
  }
  console.log(`  ✓ ${created.length} languages`);
  return created;
}

async function seedLevelsAndModules(languages) {
  console.log('→ Seeding levels, modules, activities...');
  let levelCount = 0, moduleCount = 0, activityCount = 0;

  for (const language of languages) {
    for (const lvl of LEVELS) {
      const level = await prisma.level.upsert({
        where: { languageId_code: { languageId: language.id, code: lvl.code } },
        update: lvl,
        create: { ...lvl, languageId: language.id },
      });
      levelCount++;

      for (const modTemplate of MODULES_TEMPLATE) {
        const modTitle = `[${lvl.code}] ${modTemplate.title}`;
        const existing = await prisma.module.findFirst({
          where: { levelId: level.id, title: modTitle },
        });

        let mod;
        if (existing) {
          mod = existing;
        } else {
          mod = await prisma.module.create({
            data: { ...modTemplate, title: modTitle, levelId: level.id },
          });
        }
        moduleCount++;

        for (const actTemplate of ACTIVITIES_TEMPLATE) {
          const actTitle = `${modTitle} — ${actTemplate.title}`;
          const existingAct = await prisma.activity.findFirst({
            where: { moduleId: mod.id, title: actTitle },
          });

          if (!existingAct) {
            await prisma.activity.create({
              data: { ...actTemplate, title: actTitle, moduleId: mod.id },
            });
          }
          activityCount++;
        }
      }
    }
  }

  console.log(`  ✓ ${levelCount} levels, ${moduleCount} modules, ${activityCount} activities`);
}

async function seedAchievements() {
  console.log('→ Seeding achievements...');
  for (const ach of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: ach,
      create: ach,
    });
  }
  console.log(`  ✓ ${ACHIEVEMENTS.length} achievements`);
}

async function seedPlacementTests(languages) {
  console.log('→ Seeding placement tests...');
  let total = 0;

  for (const language of languages) {
    const existing = await prisma.placementTest.findUnique({
      where: { languageId_version: { languageId: language.id, version: '1' } },
    });

    if (existing) continue;

    const test = await prisma.placementTest.create({
      data: { languageId: language.id, version: '1' },
    });

    const questions = [
      { text: `What is a basic greeting in ${language.name}?`, options: JSON.stringify(['Hello/Hi', 'Goodbye', 'Thank you', 'Sorry']), correct: 'Hello/Hi', skill: 'VOCABULARY', cefrLevel: 'A1', sortOrder: 1 },
      { text: `Which pronoun is used for the third person singular?`, options: JSON.stringify(['I', 'You', 'He/She', 'We']), correct: 'He/She', skill: 'GRAMMAR', cefrLevel: 'A1', sortOrder: 2 },
      { text: `Complete: "She ___ studying now."`, options: JSON.stringify(['am', 'is', 'are', 'be']), correct: 'is', skill: 'GRAMMAR', cefrLevel: 'A2', sortOrder: 3 },
      { text: `Which sentence is in the past tense?`, options: JSON.stringify(['I go', 'I am going', 'I went', 'I will go']), correct: 'I went', skill: 'GRAMMAR', cefrLevel: 'A2', sortOrder: 4 },
      { text: `What does "although" express?`, options: JSON.stringify(['Addition', 'Contrast', 'Cause', 'Result']), correct: 'Contrast', skill: 'VOCABULARY', cefrLevel: 'B1', sortOrder: 5 },
      { text: `"Had she known, she ___ have helped." Complete with:`, options: JSON.stringify(['would', 'will', 'can', 'may']), correct: 'would', skill: 'GRAMMAR', cefrLevel: 'B2', sortOrder: 6 },
      { text: `Which word describes a nuanced emotional state?`, options: JSON.stringify(['happy', 'sad', 'melancholic', 'angry']), correct: 'melancholic', skill: 'VOCABULARY', cefrLevel: 'C1', sortOrder: 7 },
      { text: `Which structure is most formal?`, options: JSON.stringify(['I want to tell you', 'I wish to inform you', 'I wanna tell you', 'Hey, just so you know']), correct: 'I wish to inform you', skill: 'GRAMMAR', cefrLevel: 'C2', sortOrder: 8 },
    ];

    for (const q of questions) {
      await prisma.placementQuestion.create({
        data: { ...q, testId: test.id },
      });
    }
    total++;
  }

  console.log(`  ✓ ${total} placement tests`);
}

// ─────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Starting GrammarLanguages seed...\n');

  const languages = await seedLanguages();
  await seedLevelsAndModules(languages);
  await seedAchievements();
  await seedPlacementTests(languages);

  console.log('\n✅ Seed complete!\n');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
