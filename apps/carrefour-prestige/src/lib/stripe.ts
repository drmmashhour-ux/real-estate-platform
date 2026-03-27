import Stripe from "stripe";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key?.startsWith("sk_")) return null;
  return new Stripe(key);
}
