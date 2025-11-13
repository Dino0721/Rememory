import axios from 'axios';
import admin from 'firebase-admin';

import { firestore } from '../lib/firebaseAdmin.js';
import { logger } from '../utils/logger.js';

const NOTIFICATIONS_COLLECTION = 'notifications';

const EMAIL_TEMPLATES = {
  reminder: {
    subject: 'Rememory — 3 days left with your persona',
    body: `You have 3 days remaining with your persona on Rememory. Remember this is a temporary, supportive tool. If you'd like a copy of your conversation transcript, please download it from your dashboard before the session ends.`
  },
  expiry: (personaName: string) => ({
    subject: 'Rememory — Your persona session has ended',
    body: `Your Rememory session for ${personaName} has ended. The chat is now closed. If you need additional support, please contact a grief counselor. Thank you for using Rememory.`
  })
};

export const sendEmailNotification = async (userId: string, personaId: string, type: '3day_reminder' | 'expired', personaName: string) => {
  const db = firestore();
  const notificationRef = db.collection(NOTIFICATIONS_COLLECTION).doc();

  const payload =
    type === '3day_reminder'
      ? EMAIL_TEMPLATES.reminder
      : EMAIL_TEMPLATES.expiry(personaName);

  await axios.post(
    process.env.EMAIL_WEBHOOK_URL ?? 'https://api.sendgrid.com/v3/mail/send',
    {
      personalizations: [{ to: [{ email: 'placeholder@example.com' }] }],
      from: { email: process.env.EMAIL_FROM ?? 'no-reply@rememory.app' },
      subject: payload.subject,
      content: [{ type: 'text/plain', value: payload.body }]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  await notificationRef.set({
    userId,
    personaId,
    type,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    delivered: true
  });

  logger.info({ userId, personaId, type }, 'Notification dispatched');
};

