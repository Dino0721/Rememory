import admin from 'firebase-admin';

import { firestore } from '../lib/firebaseAdmin.js';
import { sendEmailNotification } from '../services/notificationService.js';
import { logger } from '../utils/logger.js';

const PERSONAS_COLLECTION = 'personas';

export const runPersonaExpirationJob = async () => {
  const db = firestore();
  const now = Date.now();

  const soonQuery = await db
    .collection(PERSONAS_COLLECTION)
    .where('status', '==', 'active')
    .where('expiresAt', '<=', admin.firestore.Timestamp.fromMillis(now + 3 * 24 * 60 * 60 * 1000))
    .get();

  for (const doc of soonQuery.docs) {
    const persona = doc.data();
    const expiresAt = persona.expiresAt?.toDate().getTime() ?? 0;
    const msRemaining = expiresAt - now;

    if (msRemaining <= 0) {
      await doc.ref.update({ status: 'expired' });
      await sendEmailNotification(persona.ownerId, doc.id, 'expired', persona.name);
      logger.info({ personaId: doc.id }, 'Persona expired');
    } else if (msRemaining <= 3 * 24 * 60 * 60 * 1000 && !persona.reminderSent) {
      await doc.ref.update({ reminderSent: true });
      await sendEmailNotification(persona.ownerId, doc.id, '3day_reminder', persona.name);
      logger.info({ personaId: doc.id }, 'Reminder email sent');
    }
  }
};

