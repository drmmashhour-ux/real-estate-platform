import { logInfo, logWarn } from "@/lib/logger";

/**
 * Safe Stripe observability (no PAN, no secrets). Use from checkout creation + webhooks.
 */
export function logStripeCheckoutSessionCreated(args: {
  sessionId: string;
  paymentType?: string | null;
  bookingId?: string | null;
  listingId?: string | null;
  amountCents?: number | null;
}): void {
  logInfo("[STRIPE] checkout_session_created", {
    sessionId: args.sessionId,
    paymentType: args.paymentType ?? null,
    bookingId: args.bookingId ?? null,
    listingId: args.listingId ?? null,
    amountCents: args.amountCents ?? null,
  });
}

export function logStripePaymentMismatch(message: string, meta: Record<string, string | number | boolean | null>): void {
  logWarn(`[STRIPE] payment_mismatch: ${message}`, meta);
}

export { paymentIntentIdFromCheckoutSession, stripeHandleCheckoutSessionCompleted, stripeCreateOrchestratedCheckout } from "@/lib/payments/providers/stripe";
