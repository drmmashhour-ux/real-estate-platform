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
  const intent = await stripe.paymentIntents.retrieve(pi);
  const cap = typeof intent.amount_received === "number" ? intent.amount_received : intent.amount;
  if (!cap || cap <= 0) {
    return { ok: false as const, reason: "no_refundable_amount_on_intent" as const };
  }
  const refund = await stripe.refunds.create({ payment_intent: pi, amount: cap });
  logInfo("[marketplace] refund created (full available)", { paymentIntent: pi, refundId: refund.id, amount: cap });
  return { ok: true as const, refundId: refund.id, amountCents: cap };
}

/**
 * Order 59.1 — partial or full refund with pre-flight against prior refunds on the intent.
 * `refundedAmountCentsLocal` = sum already applied on our `bookings` row (Stripe can lag; see webhook for reconciliation).
 */
export async function tryRefundMarketplacePaymentAmount(
  paymentIntentId: string,
  amountCents: number,
  opts: { alreadyRefundedCents: number; maxTotalCents: number }
) {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false as const, reason: "stripe_not_configured" as const };
  }
  const pi = paymentIntentId.trim();
  if (!pi.startsWith("pi_")) {
    return { ok: false as const, reason: "invalid_payment_intent" as const };
  }
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return { ok: false as const, reason: "amount_must_be_positive" as const };
  }
  const intent = await stripe.paymentIntents.retrieve(pi);
  const received =
    typeof intent.amount_received === "number" && intent.amount_received > 0
      ? intent.amount_received
      : typeof intent.amount === "number"
        ? intent.amount
        : 0;
  if (received <= 0) {
    return { ok: false as const, reason: "no_refundable_amount_on_intent" as const };
  }
  const cap = Math.min(received, Math.max(0, opts.maxTotalCents));
  const remaining = cap - Math.max(0, opts.alreadyRefundedCents);
  if (remaining <= 0) {
    return { ok: false as const, reason: "already_fully_refunded" as const };
  }
  const toRefund = Math.min(Math.floor(amountCents), remaining);
  if (toRefund <= 0) {
    return { ok: false as const, reason: "refund_amount_zero" as const };
  }
  const refund = await stripe.refunds.create({ payment_intent: pi, amount: toRefund });
  logInfo("[marketplace] refund created (partial or capped)", { paymentIntent: pi, refundId: refund.id, amount: toRefund });
  return { ok: true as const, refundId: refund.id, amountCents: toRefund };
}
