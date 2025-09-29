
import * as admin from 'firebase-admin';

// This is a robust singleton pattern to ensure Firebase is initialized only once.
// It's safe for serverless environments like Vercel.

if (!admin.apps.length) {
  try {
    console.log("Initializing Firebase Admin SDK...");
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error("Firebase service account key (FIREBASE_SERVICE_ACCOUNT_KEY) is not set in environment variables.");
    }

    let serviceAccount: admin.ServiceAccount;
    try {
      // The key is expected to be a JSON string.
      serviceAccount = JSON.parse(serviceAccountKey);
    } catch (e) {
      // If parsing fails, try to decode from Base64, which is a common way to store it in Vercel.
      try {
        const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decodedKey);
      } catch (e2) {
         throw new Error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. It's not valid JSON or Base64-encoded JSON.");
      }
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    // Log the error for debugging but don't prevent the app from running if Firebase is not needed for a specific page.
    console.error('Firebase admin initialization error:', error);
  }
}

// getFirestore is now a function that can be called to get the firestore instance.
// It will throw an error if the initialization failed and someone tries to use it.
export const getFirestore = (): admin.firestore.Firestore | null => {
    if (!admin.apps.length) {
        // This case would happen if initialization failed.
        // We log an error and return null to prevent a hard crash.
        // The consuming function should handle the null case.
        console.error("Firebase has not been initialized. Cannot get Firestore instance.");
        return null;
    }
    return admin.firestore();
};
