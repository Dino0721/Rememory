import "dotenv/config";
import express from "express";
import admin from "firebase-admin";
import serviceAccount from "../rememory-62207-firebase-adminsdk-fbsvc-996ec2ece7.json";

const app = express();
app.use(express.json());

// Env variables
const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  PORT = "5000",
} = process.env;

// Validate env
if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error("Missing Firebase environment variables.");
  process.exit(1);
}

const firebasePrivateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: firebasePrivateKey,
  }),
});

app.get("/", (req, res) => res.send("Rememory Backend is running!"));

app.get("/health/firestore", async (req, res) => {
  try {
    await admin
      .firestore()
      .doc("_health/ping")
      .set({ ts: Date.now() }, { merge: true });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.listen(Number(PORT), () => {
  console.log(`Server running on port ${PORT}`);
});
