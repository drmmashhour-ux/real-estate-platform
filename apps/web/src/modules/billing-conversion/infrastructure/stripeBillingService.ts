import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export function assertStripeConfigured(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error("Payments are not configured");
  }
  const s = getStripe();
  if (!s) throw new Error("Payments are not configured");
  return s;
}

export function getProPriceId(): string | null {
  return process.env.STRIPE_LECIPM_PRO_PRICE_ID?.trim() || null;
}

export function getTeamPriceId(): string | null {
  return process.env.STRIPE_LECIPM_TEAM_PRICE_ID?.trim() || null;
}
