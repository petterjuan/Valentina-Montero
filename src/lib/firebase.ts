

import * as admin from 'firebase-admin';

// This is a robust singleton pattern to ensure Firebase is initialized only once.
// It's safe for serverless environments like Vercel.

let firestoreInstance: admin.firestore.Firestore | null = null;

function initializeFirebase() {
  if (admin.apps.length) {
    firestoreInstance = admin.firestore();
    return;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    console.warn("Firebase Admin SDK: FIREBASE_SERVICE_ACCOUNT_KEY is not set. Firestore will not be available.");
    return;
  }

  try {
    let serviceAccount: admin.ServiceAccount;
    
    // The key is expected to be a JSON string.
    serviceAccount = JSON.parse(serviceAccountKey);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    firestoreInstance = admin.firestore();
    console.log("Firebase Admin SDK initialized successfully.");

  } catch (error) {
    console.error('Firebase admin initialization error:', error instanceof Error ? error.message : 'An unknown error occurred');
    // Ensure firestoreInstance remains null if initialization fails
    firestoreInstance = null;
  }
}

// Initialize on module load
initializeFirebase();

/**
 * Returns the Firestore instance if initialization was successful, otherwise returns null.
 * This function is safe to call anywhere in the server-side code.
 * @returns {admin.firestore.Firestore | null} The Firestore instance or null.
 */
export const getFirestore = (): admin.firestore.Firestore | null => {
    return firestoreInstance;
};

    