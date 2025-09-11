
import * as admin from 'firebase-admin';

let firestore: admin.firestore.Firestore | null = null;
let initializationError: string | null = null;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    // The key might be Base64 encoded, try to decode it.
    let serviceAccount;
    try {
        const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decodedKey);
    } catch(e) {
        // If decoding or parsing fails, assume it's a plain JSON string.
        try {
            serviceAccount = JSON.parse(serviceAccountKey);
        } catch (jsonError) {
             throw new Error(`Failed to parse Firebase service account key. It's neither valid JSON nor valid Base64-encoded JSON.`);
        }
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    firestore = admin.firestore();
    console.log("✅ Firebase Admin SDK initialized successfully.");
  } else {
    initializationError = "Firebase service account key not found. Firestore features will be disabled.";
    console.warn(initializationError);
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
        // Using warn to avoid spamming logs with errors on every access attempt.
        console.warn(`Firestore access blocked: ${initializationError}`);
        return null;
    }
    return firestore;
}
