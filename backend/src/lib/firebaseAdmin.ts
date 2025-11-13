import admin from 'firebase-admin';

let app: admin.app.App | null = null;

export const initializeFirebaseApp = () => {
  if (app) return app;
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  };

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });

  return app;
};

export const firestore = () => {
  if (!app) {
    initializeFirebaseApp();
  }
  return admin.firestore();
};

export const auth = () => {
  if (!app) {
    initializeFirebaseApp();
  }
  return admin.auth();
};

