import { config } from "dotenv";
import * as firebaseAdmin from "firebase-admin";

// Environment Variables (Stripe API Key)
if (process.env.NODE_ENV !== "production") {
  config();
}

// Initialize Firebase Admin resources

const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

export const db = firebaseAdmin.firestore();
export const auth = firebaseAdmin.auth();
