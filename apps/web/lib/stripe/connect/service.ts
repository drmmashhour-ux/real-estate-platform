import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function getConnectAccountStatus(accountId: string, stripe?: Stripe | null) {
  const client = stripe ?? getStripe();
  if (!client) {
    throw new Error("Stripe is not configured");
  }
  const account = await client.accounts.retrieve(accountId);
  return {
    stripeAccountId: account.id,
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    detailsSubmitted: Boolean(account.details_submitted),
    onboardingComplete:
      Boolean(account.details_submitted) &&
      Boolean(account.charges_enabled) &&
      Boolean(account.payouts_enabled),
  };
}

export function assertStripeConfiguredForConnect(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured");
  }
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe client unavailable");
  return stripe;
}
