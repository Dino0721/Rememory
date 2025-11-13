import OpenAI from 'openai';
import admin from 'firebase-admin';

import { firestore } from '../lib/firebaseAdmin.js';

const CONVERSATIONS_COLLECTION = 'conversations';

const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY
});

export const summarizeMessages = async (personaId: string) => {
  const db = firestore();
  const messagesRef = db.collection(CONVERSATIONS_COLLECTION).doc(personaId).collection('messages');
  const messagesSnapshot = await messagesRef.orderBy('timestamp', 'asc').get();
  if (messagesSnapshot.size <= 300) return false;

  const messages = messagesSnapshot.docs.slice(0, 200).map((doc) => doc.data());

  const summaryPrompt = [
    {
      role: 'system',
      content: 'Summarize the following grief-support conversation in 200 words, preserving emotional themes and key facts.'
    },
    {
      role: 'user',
      content: messages.map((msg) => `${msg.sender.toUpperCase()}: ${msg.text}`).join('\n')
    }
  ];

  const result = await openai.chat.completions.create({
    model: process.env.LLM_MODEL ?? 'gpt-4o-mini',
    messages: summaryPrompt,
    temperature: 0.3,
    max_tokens: 400
  });

  const content = result.choices[0].message.content ?? '';

  await db
    .collection(CONVERSATIONS_COLLECTION)
    .doc(personaId)
    .collection('summaries')
    .add({
      content,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

  const batch = db.batch();
  messagesSnapshot.docs.slice(0, 150).forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  return true;
};

