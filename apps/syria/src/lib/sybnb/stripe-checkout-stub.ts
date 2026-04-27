/**
 * Placeholder for Stripe PaymentIntent creation — no network calls until legally enabled
 * and `assertSybnbStripePreconditions` passes. Wire `stripe` SDK here when product enables SYBNB.
 */
export function buildStubPaymentIntentId(bookingId: string): string {
  return `pi_sybnb_stub_${bookingId.slice(0, 8)}`;
}
