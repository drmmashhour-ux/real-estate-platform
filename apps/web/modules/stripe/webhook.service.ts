import Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

/**
 * Validate Stripe webhook signature. Primary webhook handler remains `app/api/stripe/webhook/route.ts`.
 */
export function constructStripeWebhookEvent(
  rawBody: string | Buffer,
  signature: string | null,
  secret: string | undefined
): Stripe.Event {
  const stripe = getStripe();
  if (!stripe || !isStripeConfigured()) {
    throw new Error("Stripe is not configured");
  }
  if (!signature || !secret) {
    throw new Error("Missing Stripe webhook signature or STRIPE_WEBHOOK_SECRET");
  }
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}
