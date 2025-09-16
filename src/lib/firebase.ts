
import * as admin from 'firebase-admin';

// This is a simplified singleton pattern to ensure Firebase is initialized only once.
let firestoreInstance: admin.firestore.Firestore | null = null;
let initError: Error | null = null;

function initializeFirebaseAdmin() {
    if (firestoreInstance) return;

    try {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountKey) {
            throw new Error("Firebase service account key (FIREBASE_SERVICE_ACCOUNT_KEY) is not set in environment variables.");
        }

        let serviceAccount: admin.ServiceAccount;
        try {
            // Prefer Base64 decoding, as it's common for environment variables.
            const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
            serviceAccount = JSON.parse(decodedKey);
        } catch (e) {
            // Fallback to direct JSON parsing if Base64 fails.
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

        firestoreInstance = admin.firestore();

    } catch (error) {
        if (error instanceof Error) {
            initError = error;
        } else {
            initError = new Error(String(error));
        }
        console.error("❌ Error initializing Firebase Admin SDK:", initError.message);
        firestoreInstance = null; // Ensure instance is null on failure
    }
}

// Call initialization on module load.
initializeFirebaseAdmin();

export const getFirestore = (): admin.firestore.Firestore | null => {
    if (initError) {
        // Log the persistent error if anyone tries to get the instance after a failed init.
        console.warn(`Firestore access blocked due to initialization error: ${initError.message}`);
        return null;
    }
    return firestoreInstance;
}

    