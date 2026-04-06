/**
 * Normalizes Stripe Checkout Session + PaymentIntent metadata for reliable webhooks.
 * Always includes `userId` and `paymentType`; booking flows require `bookingId` + `listingId`.
 */

export function compactStripeMetadata(input: Record<string, string | undefined | null>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v == null) continue;
    const s = String(v).trim();
    if (!s) continue;
    out[k] = s.slice(0, 500);
  }
  return out;
}

export function assertCoreCheckoutMetadata(m: Record<string, string>): void {
  if (!m.userId) {
    throw new Error("Stripe metadata: userId is required");
  }
  if (!m.paymentType) {
    throw new Error("Stripe metadata: paymentType is required");
  }
}

/** Returns an error message or null when valid. */
export function validateBookingPaymentMetadata(m: Record<string, string>): string | null {
  if (m.paymentType !== "booking") return null;
  if (!m.bookingId) return "bookingId is required for booking checkout metadata";
  if (!m.listingId) return "listingId is required for booking checkout metadata";
  return null;
}
