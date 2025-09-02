import * as admin from 'firebase-admin';

let firestore: admin.firestore.Firestore | null = null;

try {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : null;

  if (serviceAccount) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    firestore = admin.firestore();
  } else {
    console.warn("Firebase service account key not found. Firestore will not be initialized. Make sure FIREBASE_SERVICE_ACCOUNT_KEY is set in your environment variables.");
  }
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
}

// Export a function to get Firestore, which will return null if not initialized
export const getFirestore = () => {
    if (!firestore) {
        console.warn("Firestore is not initialized. Returning null.");
    }
    return firestore;
}