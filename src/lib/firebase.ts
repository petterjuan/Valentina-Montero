
import * as admin from 'firebase-admin';

let firestore: admin.firestore.Firestore | null = null;
let initializationError: string | null = null;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    let serviceAccount;
    try {
        // First, assume it's Base64 encoded and try to decode.
        const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decodedKey);
    } catch (e) {
        // If decoding fails, assume it's a plain JSON string.
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

export const getFirestore = () => {
    if (initializationError) {
        console.warn(`Firestore access blocked: ${initializationError}`);
        return null;
    }
    return firestore;
}
