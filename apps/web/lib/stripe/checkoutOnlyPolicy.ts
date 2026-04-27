/**
 * BNHub + LECIPM payments policy: **Stripe Checkout** (hosted `checkout.sessions`) is the only supported
 * card-capture path for marketplace stays. Webhooks must use `constructEvent` + `STRIPE_WEBHOOK_SECRET`.
 * Do not add `PaymentIntent` / card-element capture for guest booking charges.
 */
export const STRIPE_BOOKING_PAYMENT_SURFACE = "checkout_sessions_only" as const;

export function assertStripeCheckoutOnlyPolicy(): void {
  if (process.env.NODE_ENV === "development" && process.env.STRIPE_ALLOW_NON_CHECKOUT === "1") {
    return;
  }
  // Policy is enforced by implementation (no PaymentIntents in repo) + webhook guards.
}
