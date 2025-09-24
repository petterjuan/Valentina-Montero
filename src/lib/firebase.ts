
import * as admin from 'firebase-admin';

// This is a robust singleton pattern to ensure Firebase is initialized only once on the server.
let firestoreInstance: admin.firestore.Firestore | null = null;
let initError: Error | null = null;
let isInitialized = false;

function initializeFirebaseAdmin(): admin.firestore.Firestore | null {
    if (isInitialized) {
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
        // Instead of logging, we store the error and return null. The caller can handle it.
        firestoreInstance = null;
        throw initError;
    }
}

export const getFirestore = (): admin.firestore.Firestore | null => {
    if (isInitialized) {
        if (initError) {
             // The original error is re-thrown by initializeFirebaseAdmin if called again,
             // or the caller that got the null instance can handle it.
             throw initError;
        }
        return firestoreInstance;
    }
    return initializeFirebaseAdmin();
}
    