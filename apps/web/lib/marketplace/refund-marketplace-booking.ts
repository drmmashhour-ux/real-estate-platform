import { getStripe } from "@/lib/stripe";
import { logInfo } from "@/lib/logger";

/**
 * Best-effort full refund for a paid marketplace booking (Order 59). Requires `payment_intent` id on file.
 */
export async function tryRefundMarketplacePayment(paymentIntentId: string) {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false as const, reason: "stripe_not_configured" as const };
  }
  const pi = paymentIntentId.trim();
  if (!pi.startsWith("pi_")) {
    return { ok: false as const, reason: "invalid_payment_intent" as const };
  }
  const refund = await stripe.refunds.create({ payment_intent: pi });
  logInfo("[marketplace] refund created", { paymentIntent: pi, refundId: refund.id });
  return { ok: true as const, refundId: refund.id };
}
