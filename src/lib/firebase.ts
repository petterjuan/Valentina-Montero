"use server"
import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Initialize for local development or environments without service account key
    // This requires GOOGLE_APPLICATION_CREDENTIALS to be set in the environment
    admin.initializeApp();
  }
}

export const firestore = admin.firestore();
