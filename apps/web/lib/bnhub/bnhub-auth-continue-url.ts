/**
 * Where to send the user after BNHub auth when they started anonymous on a listing.
 * Instant book + Stripe → checkout (payment step). Otherwise → listing with dates in query.
 */
export function buildBnhubAuthContinueUrl(opts: {
  listingId: string;
  /** For `/bnhub/stays/[slug]` — listing code or id */
  listingStaySlug: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  maxGuests: number;
  instantBookEnabled: boolean;
  stripeConfigured: boolean;
  hostPayoutReady: boolean;
}): string {
  const {
    listingId,
    listingStaySlug,
    checkIn,
    checkOut,
    guestCount,
    maxGuests,
    instantBookEnabled,
    stripeConfigured,
    hostPayoutReady,
  } = opts;
  const gc = Math.min(maxGuests, Math.max(1, Math.floor(guestCount)));
  const canStripeCheckout = instantBookEnabled && stripeConfigured && hostPayoutReady;
  if (canStripeCheckout) {
    const q = new URLSearchParams({
      listingId,
      checkIn,
      checkOut,
      guestCount: String(gc),
    });
    return `/bnhub/checkout?${q.toString()}`;
  }
  const q = new URLSearchParams({ checkIn, checkOut, guests: String(gc) });
  return `/bnhub/stays/${encodeURIComponent(listingStaySlug)}?${q.toString()}`;
}
