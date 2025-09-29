
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
            // Directly parse the JSON string from the environment variable
            serviceAccount = JSON.parse(serviceAccountKey);
        } catch (e) {
            throw new Error("Failed to parse Firebase service account key. The environment variable does not contain valid JSON.");
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
        firestoreInstance = null;
        throw initError;
    }
}

export const getFirestore = (): admin.firestore.Firestore | null => {
    if (isInitialized) {
        if (initError) {
             throw initError;
        }
        return firestoreInstance;
    }
    return initializeFirebaseAdmin();
}
    