

import Stripe from "stripe";

// This file is for BACKEND USE ONLY.
// It uses the secret key and should never be exposed to the client.

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
  typescript: true,
});

    