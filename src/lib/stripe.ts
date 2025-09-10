
import Stripe from 'stripe';

let stripe: Stripe | null = null;
let initializationError: string | null = null;

try {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey) {
    stripe = new Stripe(stripeKey, {
      apiVersion: '2024-06-20',
      typescript: true,
    });
  } else {
    initializationError = "Stripe secret key not found. Stripe features will be disabled.";
  }
} catch (error) {
  const message = `Error initializing Stripe: ${error instanceof Error ? error.message : String(error)}`;
  initializationError = `${message}. Stripe features will be disabled.`;
  console.error(initializationError);
}

export const getStripe = () => {
    if (initializationError) {
        console.error(`Stripe access blocked: ${initializationError}`);
        return null;
    }
    return stripe;
}
