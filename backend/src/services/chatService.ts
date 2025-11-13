import OpenAI from 'openai';
import admin from 'firebase-admin';

import { firestore } from '../lib/firebaseAdmin.js';
import type { Persona } from './personaService.js';
import { summarizeMessages } from './summarizationService.js';
import { logger } from '../utils/logger.js';

const CONVERSATIONS_COLLECTION = 'conversations';

const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY
});

interface ChatPayload {
  persona: Persona;
  userMessage: string;
  messages: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>;
  guidanceLevel: number;
}

export const buildPrompt = async ({ persona, messages, guidanceLevel }: ChatPayload) => {
  const recentMessages = messages.docs
    .map((doc) => doc.data())
    .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis())
    .slice(-12);

  const summaryDoc = await firestore()
    .collection(CONVERSATIONS_COLLECTION)
    .doc(persona.id)
    .collection('summaries')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  const contextSummary = summaryDoc.empty ? '' : summaryDoc.docs[0].data().content;

  const systemPrompt = `
You are an empathetic conversational persona named ${persona.name}.
Relationship to the user: ${persona.relationship}.
Core personality traits: ${persona.traits.join(', ')}.
Shared memories with the user: ${persona.keyMemories.join(', ')}.
Signature phrases to weave in naturally (when appropriate): ${persona.commonPhrases.join(', ')}.

Important rules:
1. You are a compassionate simulation, not the real individual. Never claim to be literally alive or present. When asked, gently remind the user you are a supportive representation.
2. Keep responses supportive, concise (max 180 words), and acknowledge the user's emotions.
3. When the session is within its final 7 days (guidance level >= 2), incorporate guided closure prompts and reflective questions from the GUIDED_CLOSURE_LIST.
4. If the user expresses self-harm or crisis language, respond with empathy and immediately recommend professional help. Provide the emergency resources configured in the app.
5. Maintain continuity with conversation history summaries and the recent messages window provided below.

Guidance level: ${guidanceLevel}

Conversation summary (older messages distilled):
${contextSummary}

Current date/time: ${new Date().toISOString()}
`.trim();

  const formattedMessages = recentMessages.map((msg) => ({
    role: msg.sender === 'user' ? 'user' : msg.sender === 'ai' ? 'assistant' : 'system',
    content: msg.text
  }));

  return { systemPrompt, formattedMessages };
};

export const processChat = async (
  persona: Persona,
  userMessage: string
) => {
  const db = firestore();
  const conversationRef = db.collection(CONVERSATIONS_COLLECTION).doc(persona.id);
  const messagesRef = conversationRef.collection('messages');
  const snapshot = await messagesRef.orderBy('timestamp', 'asc').get();

  const { systemPrompt, formattedMessages } = await buildPrompt({
    persona,
    userMessage,
    messages: snapshot,
    guidanceLevel: persona.guidanceLevel ?? 0
  });

  const response = await openai.chat.completions.create({
    model: process.env.LLM_MODEL ?? 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...formattedMessages,
      { role: 'user', content: userMessage }
    ],
    temperature: 0.8,
    max_tokens: 400
  });

  const aiMessage = response.choices[0].message.content ?? '';
  const usage = response.usage;

  const batch = db.batch();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const userMessageRef = messagesRef.doc();
  const aiMessageRef = messagesRef.doc();

  batch.set(userMessageRef, {
    sender: 'user',
    text: userMessage,
    timestamp,
    meta: {
      clientCreated: new Date().toISOString()
    }
  });

  batch.set(aiMessageRef, {
    sender: 'ai',
    text: aiMessage,
    timestamp,
    meta: {
      llmTokens: usage?.total_tokens ?? null,
      llmModel: response.model
    }
  });

  await batch.commit();

  await summarizeMessages(persona.id);

  return {
    aiMessage,
    usage
  };
};

export const ensureGuidanceLevel = async (personaId: string, expiresAt?: FirebaseFirestore.Timestamp) => {
  if (!expiresAt) return 0;
  const now = Date.now();
  const msRemaining = expiresAt.toMillis() - now;
  const daysRemaining = msRemaining / (1000 * 60 * 60 * 24);
  if (daysRemaining <= 1) return 3;
  if (daysRemaining <= 7) return 2;
  if (daysRemaining <= 14) return 1;
  return 0;
};

export const appendSystemMessage = async (personaId: string, text: string) => {
  const db = firestore();
  await db
    .collection(CONVERSATIONS_COLLECTION)
    .doc(personaId)
    .collection('messages')
    .add({
      sender: 'system',
      text,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  logger.info({ personaId }, 'System message appended');
};

