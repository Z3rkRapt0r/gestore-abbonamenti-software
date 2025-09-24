import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // Use the SDK's default pinned version to satisfy types
  // or fallback to 'latest' to avoid type mismatch in CI/build
  // Remove this field to use the SDK default
  // apiVersion: 'latest',
});

export const stripeConfig = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
};

