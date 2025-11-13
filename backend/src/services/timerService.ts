import admin from 'firebase-admin';

import { firestore } from '../lib/firebaseAdmin.js';

const PERSONAS_COLLECTION = 'personas';

export const setTimerIfNeeded = async (personaId: string) => {
  const db = firestore();
  const personaRef = db.collection(PERSONAS_COLLECTION).doc(personaId);
  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(personaRef);
    if (!doc.exists) {
      throw Object.assign(new Error('Persona not found'), { status: 404, code: 'persona_not_found' });
    }
    const data = doc.data()!;
    if (data.startedAt) return;
    const now = Date.now();
    const startedAt = admin.firestore.FieldValue.serverTimestamp();
    const expiresAt = admin.firestore.Timestamp.fromMillis(now + 30 * 24 * 60 * 60 * 1000);
    transaction.update(personaRef, { startedAt, expiresAt, status: 'active' });
  });
};

export const computeRemainingMs = (expiresAt?: FirebaseFirestore.Timestamp | null) => {
  if (!expiresAt) return null;
  return Math.max(0, expiresAt.toMillis() - Date.now());
};

