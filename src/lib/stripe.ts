
import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;
let initError: Error | null = null;

function initializeStripe() {
    if (stripeInstance) return;

    try {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) {
            throw new Error("Stripe secret key (STRIPE_SECRET_KEY) not found in environment variables.");
        }
        
        stripeInstance = new Stripe(stripeKey, {
            apiVersion: '2024-06-20',
            typescript: true,
        });
        console.log("✅ Stripe SDK initialized successfully.");

    } catch (error) {
        if (error instanceof Error) {
            initError = error;
        } else {
            initError = new Error(String(error));
        }
        console.error("❌ Error initializing Stripe:", initError.message);
        stripeInstance = null;
    }
}

initializeStripe();

export const getStripe = (): Stripe | null => {
    if (initError) {
        console.warn(`Stripe access blocked due to initialization error: ${initError.message}`);
        return null;
    }
    return stripeInstance;
}

    