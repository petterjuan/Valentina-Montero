import * as admin from 'firebase-admin';

let firestore: admin.firestore.Firestore | null = null;
let initializationError: Error | null = null;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    firestore = admin.firestore();
  } else {
    // This is a critical configuration error.
    initializationError = new Error("Firebase service account key not found. Make sure FIREBASE_SERVICE_ACCOUNT_KEY is set in your environment variables.");
    console.error(initializationError.message);
  }
} catch (error) {
  initializationError = new Error(`Error initializing Firebase Admin SDK: ${error instanceof Error ? error.message : String(error)}`);
  console.error(initializationError.message);
}

// Export a function to get Firestore. It will now throw if initialization failed.
export const getFirestore = () => {
    if (initializationError) {
        throw initializationError;
    }
    if (!firestore) {
        // This case should theoretically not be reached if initializationError is handled, but it's a good safeguard.
        throw new Error("Firestore is not initialized. The Admin SDK might have failed to initialize without throwing an error.");
    }
    return firestore;
}
