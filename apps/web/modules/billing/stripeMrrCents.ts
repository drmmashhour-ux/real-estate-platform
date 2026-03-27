import type Stripe from "stripe";

/**
 * Normalize Stripe recurring price to approximate monthly recurring amount in cents.
 * Used only when syncing from Stripe webhooks (billing source of truth).
 */
export function mrrCentsFromStripeSubscription(sub: Stripe.Subscription): number | null {
  const price = sub.items.data[0]?.price;
  if (price == null) return null;
  const unit = price.unit_amount;
  if (unit == null) return null;
  const interval = price.recurring?.interval;
  if (interval === "month") return unit;
  if (interval === "year") return Math.round(unit / 12);
  if (interval === "week") return Math.round((unit * 52) / 12);
  if (interval === "day") return Math.round(unit * 30);
  return null;
}
