import Stripe from 'stripe';

// Initialize Stripe only if the secret key is available
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      // Use the SDK's default pinned version to satisfy types
      // or fallback to 'latest' to avoid type mismatch in CI/build
      // Remove this field to use the SDK default
      // apiVersion: 'latest',
    })
  : null;

export const stripeConfig = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
};

