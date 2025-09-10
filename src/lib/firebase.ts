
import * as admin from 'firebase-admin';

let firestore: admin.firestore.Firestore | null = null;
let initializationError: string | null = null;

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
    initializationError = "Firebase service account key not found. Firestore features will be disabled.";
    console.error(initializationError);
  }
} catch (error) {
  const message = `Error initializing Firebase Admin SDK: ${error instanceof Error ? error.message : String(error)}`;
  initializationError = `${message}. Firestore features will be disabled.`;
  console.error(initializationError);
}

// Export a function to get Firestore. It will now return null if initialization failed.
export const getFirestore = () => {
    if (initializationError) {
        // Log the reason for failure when access is attempted.
        console.error(`Firestore access blocked: ${initializationError}`);
        return null;
    }
    return firestore;
}
