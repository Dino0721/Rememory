import admin from 'firebase-admin';

import { firestore } from '../lib/firebaseAdmin.js';

const PERSONAS_COLLECTION = 'personas';
const CONVERSATIONS_COLLECTION = 'conversations';

export interface Persona {
  id: string;
  ownerId: string;
  name: string;
  relationship: string;
  traits: string[];
  keyMemories: string[];
  commonPhrases: string[];
  voiceSampleUrl?: string;
  status: 'active' | 'expired' | 'deleted';
  createdAt: FirebaseFirestore.Timestamp;
  startedAt?: FirebaseFirestore.Timestamp;
  expiresAt?: FirebaseFirestore.Timestamp;
  guidanceLevel?: number;
}

export const getPersonaByOwner = async (ownerId: string) => {
  const snapshot = await firestore()
    .collection(PERSONAS_COLLECTION)
    .where('ownerId', '==', ownerId)
    .where('status', '!=', 'deleted')
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...(doc.data() as Omit<Persona, 'id'>) };
};

export const createPersona = async (ownerId: string, data: Omit<Persona, 'id' | 'ownerId' | 'createdAt' | 'status'>) => {
  const existing = await getPersonaByOwner(ownerId);
  if (existing) {
    throw Object.assign(new Error('Persona already exists'), { status: 400, code: 'persona_exists' });
  }

  const docRef = await firestore().collection(PERSONAS_COLLECTION).add({
    ...data,
    ownerId,
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return docRef.id;
};

export const updatePersona = async (personaId: string, ownerId: string, updates: Partial<Persona>) => {
  const docRef = firestore().collection(PERSONAS_COLLECTION).doc(personaId);
  const doc = await docRef.get();
  if (!doc.exists || doc.data()?.ownerId !== ownerId) {
    throw Object.assign(new Error('Persona not found'), { status: 404, code: 'persona_not_found' });
  }
  await docRef.update(updates);
};

export const markPersonaStarted = async (personaId: string) => {
  const docRef = firestore().collection(PERSONAS_COLLECTION).doc(personaId);
  await firestore().runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef);
    if (!doc.exists) {
      throw Object.assign(new Error('Persona not found'), { status: 404, code: 'persona_not_found' });
    }
    const data = doc.data()!;
    if (data.startedAt) return;
    const startedAt = admin.firestore.FieldValue.serverTimestamp();
    const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000);
    transaction.update(docRef, { startedAt, expiresAt, guidanceLevel: 0 });
  });
};

export const deletePersonaCascade = async (personaId: string, ownerId: string) => {
  const db = firestore();
  const personaRef = db.collection(PERSONAS_COLLECTION).doc(personaId);
  const personaDoc = await personaRef.get();
  if (!personaDoc.exists || personaDoc.data()?.ownerId !== ownerId) {
    throw Object.assign(new Error('Persona not found'), { status: 404, code: 'persona_not_found' });
  }

  await db.runTransaction(async (transaction) => {
    transaction.delete(personaRef);
  });

  const messagesQuery = await db.collection(CONVERSATIONS_COLLECTION).doc(personaId).collection('messages').get();
  const batch = db.batch();
  messagesQuery.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  await db.collection(CONVERSATIONS_COLLECTION).doc(personaId).delete();
};

