
import Stripe from 'stripe';

let stripe: Stripe | null = null;
let initializationError: Error | null = null;
let initialized = false;

function initializeStripe() {
    if (initialized) {
        return;
    }
    initialized = true;

    try {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) {
            throw new Error("Stripe secret key (STRIPE_SECRET_KEY) not found in environment variables.");
        }
        
        stripe = new Stripe(stripeKey, {
            apiVersion: '2024-06-20',
            typescript: true,
        });
        console.log("✅ Stripe SDK initialized successfully.");

    } catch (error) {
        if (error instanceof Error) {
            initializationError = error;
        } else {
            initializationError = new Error(String(error));
        }
        console.error("❌ Error initializing Stripe:", initializationError.message);
        stripe = null;
    }
}

export const getStripe = (): Stripe | null => {
    if (!initialized) {
        initializeStripe();
    }

    if (initializationError) {
        console.warn(`Stripe access blocked due to initialization error: ${initializationError.message}`);
        return null;
    }
    
    return stripe;
}
