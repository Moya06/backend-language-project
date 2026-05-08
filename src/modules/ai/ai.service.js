'use strict';
/**
 * AI Integration — Phase 3
 *
 * These endpoints are OPTIONAL. The app works perfectly without them.
 * Set OPENAI_API_KEY in .env to enable.
 *
 * Writing correction: GPT-4o
 * Speaking evaluation: Whisper + GPT-4o
 */

const { OPENAI_API_KEY, OPENAI_MODEL } = require('../../config/env');

const AI_ENABLED = !!OPENAI_API_KEY;

// ── Writing correction ─────────────────────────────────────
const correctWriting = async ({ text, prompt, targetLanguage }) => {
  if (!AI_ENABLED) {
    return {
      enabled: false,
      message: 'AI features require OPENAI_API_KEY to be configured',
    };
  }

  const OpenAI = require('openai');
  const client = new OpenAI({ apiKey: OPENAI_API_KEY });

  const systemPrompt = `You are a ${targetLanguage} language tutor. 
Analyze the student's writing and provide:
1. Corrected version
2. List of errors with explanations
3. Suggestions for improvement
Respond as JSON: { corrected, errors: [{original, correction, explanation}], suggestions, score }`;

  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Prompt: "${prompt}"\n\nStudent text: "${text}"` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  try {
    return JSON.parse(response.choices[0].message.content);
  } catch {
    return { raw: response.choices[0].message.content };
  }
};

// ── Speaking evaluation (audio file path) ─────────────────
const evaluateSpeaking = async ({ audioBuffer, prompt, targetLanguage }) => {
  if (!AI_ENABLED) {
    return {
      enabled: false,
      message: 'AI features require OPENAI_API_KEY to be configured',
    };
  }

  const OpenAI = require('openai');
  const { toFile } = require('openai');
  const client = new OpenAI({ apiKey: OPENAI_API_KEY });

  // Step 1: Transcribe with Whisper
  const transcription = await client.audio.transcriptions.create({
    model: 'whisper-1',
    file: await toFile(audioBuffer, 'audio.webm', { type: 'audio/webm' }),
    language: targetLanguage,
  });

  const transcript = transcription.text;

  // Step 2: Evaluate with GPT-4o
  const evalResponse = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a ${targetLanguage} pronunciation and fluency evaluator. 
Given a transcript of a student's spoken response, evaluate:
1. Pronunciation accuracy (score 0-100)
2. Fluency and grammar
3. Relevant to the prompt
Respond as JSON: { pronunciationScore, fluencyScore, grammarScore, overallScore, feedback, transcript }`,
      },
      {
        role: 'user',
        content: `Prompt: "${prompt}"\nTranscript: "${transcript}"`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  try {
    const evaluation = JSON.parse(evalResponse.choices[0].message.content);
    return { ...evaluation, transcript };
  } catch {
    return { transcript, raw: evalResponse.choices[0].message.content };
  }
};

module.exports = { correctWriting, evaluateSpeaking, AI_ENABLED };
