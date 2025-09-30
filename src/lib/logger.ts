
'use server';

import { getFirestore } from './firebase';

type LogLevel = 'info' | 'warn' | 'error';

export async function logEvent(message: string, metadata: Record<string, any> = {}, level: LogLevel = 'info') {
    try {
        const firestore = getFirestore();
        if (!firestore) {
            // If firestore is not available, log to console as a fallback.
            console.error(`[${level.toUpperCase()}] Logger: Firestore not available. Event: ${message}`, metadata);
            return;
        }

        const logEntry = {
            message,
            level,
            timestamp: new Date(),
            metadata: metadata,
        };

        await firestore.collection('logs').add(logEntry);
    } catch (error) {
        console.error('Failed to write log to Firestore:', error);
        // Fallback to console logging if Firestore write fails
        console.error(`[${level.toUpperCase()}] (Firestore-Fallback) ${message}`, metadata);
    }
}
