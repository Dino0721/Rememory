import * as functions from 'firebase-functions';

import app from '../app.js';
import { initializeFirebaseApp } from '../lib/firebaseAdmin.js';
import { runPersonaExpirationJob } from '../jobs/personaExpirationJob.js';

initializeFirebaseApp();

export const api = functions.https.onRequest(app);

export const scheduledPersonaMonitor = functions.pubsub.schedule('every 6 hours').onRun(async () => {
  await runPersonaExpirationJob();
});

