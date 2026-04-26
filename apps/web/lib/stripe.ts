/**
 * Stripe server-side client. Use for Checkout Sessions and webhooks.
 * Requires STRIPE_SECRET_KEY. Webhook requires STRIPE_WEBHOOK_SECRET.
 */

import Stripe from "stripe";
import { isDemoMode } from "@/lib/demo-mode";

function isValidStripeSecretKey(key: string): boolean {
  const k = key.trim();
  // Reject publishable keys accidentally pasted as secret
  if (k.startsWith("pk_")) return false;
  return k.startsWith("sk_test_") || k.startsWith("sk_live_");
}

export function getStripe(): Stripe | null {
  if (isDemoMode()) return null;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !isValidStripeSecretKey(secretKey)) return null;
  return new Stripe(secretKey);
}

export function isStripeConfigured(): boolean {
  if (isDemoMode()) return false;
  const k = process.env.STRIPE_SECRET_KEY;
  return Boolean(k && isValidStripeSecretKey(k));
}

/** Get webhook secret for signature verification. Do not use for validation on redirect pages. */
export function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET ?? null;
}

/** Verify webhook event from raw body and signature. Returns event or null. */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event | null {
  const stripe = getStripe();
  if (!stripe) return null;
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return null;
  }
}

/**
 * Eager Stripe client for simple Hosted Checkout demos (`POST /api/checkout`).
 * Respects demo mode and the same key validation as {@link getStripe}. When unavailable, this is `null`.
 *
 * **Production BNHub booking payments** should continue to use `/api/stripe/checkout` and webhook-confirmed state.
 */
export const stripe: Stripe | null = (() => {
  if (isDemoMode()) return null;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !isValidStripeSecretKey(secretKey)) return null;
  return new Stripe(secretKey, {
    apiVersion: "2023-10-16",
  });
})();
