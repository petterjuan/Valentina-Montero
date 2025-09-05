import Stripe from 'stripe';

let stripe: Stripe | null = null;
let initializationError: Error | null = null;

try {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey) {
    stripe = new Stripe(stripeKey, {
      apiVersion: '2024-06-20',
      typescript: true,
    });
  } else {
    initializationError = new Error("Stripe secret key not found. Make sure STRIPE_SECRET_KEY is set in your environment variables.");
    console.error(initializationError.message);
  }
} catch (error) {
  initializationError = new Error(`Error initializing Stripe: ${error instanceof Error ? error.message : String(error)}`);
  console.error(initializationError.message);
}

export const getStripe = () => {
    if (initializationError) {
        throw initializationError;
    }
    if (!stripe) {
        throw new Error("Stripe is not initialized. The SDK might have failed to initialize.");
    }
    return stripe;
}
