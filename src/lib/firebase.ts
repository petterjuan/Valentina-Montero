
import * as admin from 'firebase-admin';

// This is a robust singleton pattern to ensure Firebase is initialized only once on the server.
let firestoreInstance: admin.firestore.Firestore | null = null;
let initError: Error | null = null;
let isInitialized = false;

function initializeFirebaseAdmin(): admin.firestore.Firestore | null {
    if (isInitialized) {
        if (initError) throw initError;
        return firestoreInstance;
    }
    isInitialized = true; // Mark as initialized to prevent re-entry

    try {
        if (admin.apps.length > 0) {
            firestoreInstance = admin.firestore();
            return firestoreInstance;
        }

        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountKey) {
            throw new Error("Firebase service account key (FIREBASE_SERVICE_ACCOUNT_KEY) is not set in environment variables.");
        }

        let serviceAccount: admin.ServiceAccount;
        try {
            const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
            serviceAccount = JSON.parse(decodedKey);
        } catch (e) {
            throw new Error("Failed to parse Firebase service account key. It is not valid Base64-encoded JSON.");
        }
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        
        firestoreInstance = admin.firestore();
        return firestoreInstance;

    } catch (error) {
        if (error instanceof Error) {
            initError = error;
        } else {
            initError = new Error(String(error));
        }
        // Do not log here to prevent circular dependency
        firestoreInstance = null;
        throw initError;
    }
}

export const getFirestore = (): admin.firestore.Firestore | null => {
    // This function is designed to throw an error on failure, which will be caught by Next.js's error handling.
    // If it returns, it's either the instance or null if it couldn't initialize but didn't throw.
    // In a server action context, we want to fail loudly if the core DB connection isn't there.
    try {
        return initializeFirebaseAdmin();
    } catch(e) {
        // We catch and log here, but getFirestore will return null, allowing the app to run
        // but indicating a failure state for functions that use it.
        // This prevents server crashes on startup.
        console.error("FATAL: Could not initialize Firebase Admin SDK. Firestore will be unavailable.", e);
        return null;
    }
}
    