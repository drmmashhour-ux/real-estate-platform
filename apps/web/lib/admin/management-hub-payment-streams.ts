/**
 * Pure aggregation for Admin Management Hub “money in” — checkout rows (`PlatformPayment` paid)
 * plus BNHUB booking platform fees (`Payment.platformFeeCents`).
 * Used by `getManagementHubMoneySnapshot` and unit tests.
 */

export type StreamBreakdownCents = {
  leadsCents: number;
  bookingsCents: number;
  featuredCents: number;
  otherCents: number;
  /** Sum of the four streams (booking checkout gross lives in `Payment`, not here). */
  totalCents: number;
};

/** Product-line / “plan” buckets for paid checkout (see admin panel charts). */
export const MANAGEMENT_HUB_LEAD_PAYMENT_TYPES = new Set([
  "listing_contact_lead",
  "lead_marketplace",
  "lead_unlock",
  "mortgage_contact_unlock",
]);

export const MANAGEMENT_HUB_BOOKING_CHECKOUT_PAYMENT_TYPE = "booking";

export const MANAGEMENT_HUB_FEATURED_PAYMENT_TYPES = new Set(["featured_listing"]);

export function streamTotal(s: Pick<StreamBreakdownCents, "leadsCents" | "bookingsCents" | "featuredCents" | "otherCents">): number {
  return s.leadsCents + s.bookingsCents + s.featuredCents + s.otherCents;
}

/**
 * Fold paid `PlatformPayment` rows into stream buckets.
 * Rows with `paymentType === "booking"` are skipped here — gross booking charges are not double-counted;
 * platform income from stays is taken from `Payment.platformFeeCents` separately.
 */
export function foldPaidPlatformPaymentsIntoStreams(
  rows: ReadonlyArray<{ paymentType: string; amountCents: number }>
): Omit<StreamBreakdownCents, "totalCents"> {
  const out = { leadsCents: 0, bookingsCents: 0, featuredCents: 0, otherCents: 0 };
  for (const r of rows) {
    if (r.paymentType === MANAGEMENT_HUB_BOOKING_CHECKOUT_PAYMENT_TYPE) continue;
    if (MANAGEMENT_HUB_LEAD_PAYMENT_TYPES.has(r.paymentType)) out.leadsCents += r.amountCents;
    else if (MANAGEMENT_HUB_FEATURED_PAYMENT_TYPES.has(r.paymentType)) out.featuredCents += r.amountCents;
    else out.otherCents += r.amountCents;
  }
  return out;
}

/** Add BNHUB (and similar) platform fee totals into `bookingsCents` and recompute `totalCents`. */
export function withTotalCents(base: Omit<StreamBreakdownCents, "totalCents"> & { totalCents?: number }): StreamBreakdownCents {
  const { leadsCents, bookingsCents, featuredCents, otherCents } = base;
  const totalCents = streamTotal({ leadsCents, bookingsCents, featuredCents, otherCents });
  return { leadsCents, bookingsCents, featuredCents, otherCents, totalCents };
}

/**
 * Apply booking platform fees (from `Payment` aggregate) to streams.
 */
export function addBookingPlatformFeesToStreams(
  streams: Omit<StreamBreakdownCents, "totalCents">,
  bookingPlatformFeeCents: number
): StreamBreakdownCents {
  const bookingsCents = streams.bookingsCents + bookingPlatformFeeCents;
  return withTotalCents({
    leadsCents: streams.leadsCents,
    bookingsCents,
    featuredCents: streams.featuredCents,
    otherCents: streams.otherCents,
  });
}
