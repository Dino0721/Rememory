import app from './app.js';
import { initializeFirebaseApp } from './lib/firebaseAdmin.js';

const port = Number(process.env.PORT ?? 4000);

initializeFirebaseApp();

app.listen(port, () => {
  console.log(`Rememory API listening on port ${port}`);
});

