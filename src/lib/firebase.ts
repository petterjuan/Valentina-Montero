
import * as admin from 'firebase-admin';

let firestore: admin.firestore.Firestore | null = null;
let initializationError: Error | null = null;
let initialized = false;

function initializeFirebase() {
    if (initialized) {
        return;
    }
    initialized = true; // Attempt initialization only once

    try {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountKey) {
            throw new Error("Firebase service account key (FIREBASE_SERVICE_ACCOUNT_KEY) is not set in environment variables.");
        }

        let serviceAccount: admin.ServiceAccount;
        try {
            const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
            serviceAccount = JSON.parse(decodedKey);
        } catch (e) {
            try {
                serviceAccount = JSON.parse(serviceAccountKey);
            } catch (jsonError) {
                throw new Error("Failed to parse Firebase service account key. It is not valid JSON or Base64-encoded JSON.");
            }
        }
        
        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log("✅ Firebase Admin SDK initialized successfully.");
        }

        firestore = admin.firestore();

    } catch (error) {
        if (error instanceof Error) {
            initializationError = error;
        } else {
            initializationError = new Error(String(error));
        }
        console.error("❌ Error initializing Firebase Admin SDK:", initializationError.message);
        firestore = null;
    }
}


export const getFirestore = (): admin.firestore.Firestore | null => {
    // Initialize on first call
    if (!initialized) {
        initializeFirebase();
    }

    if (initializationError) {
        // Log the error each time access is attempted if initialization failed.
        // This makes debugging easier if the app continues to run.
        console.warn(`Firestore access blocked due to initialization error: ${initializationError.message}`);
        return null;
    }
    
    return firestore;
}
