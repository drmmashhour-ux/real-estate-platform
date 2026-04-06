import { prisma } from "../../lib/db";

export type GrowthFunnelSnapshot = {
  sinceIso: string;
  totalEvents: number;
  byEventName: Record<string, number>;
};

export async function countGrowthFunnelEventsSince(since: Date): Promise<GrowthFunnelSnapshot> {
  const rows = await prisma.growthFunnelEvent.groupBy({
    by: ["eventName"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });
  const byEventName: Record<string, number> = {};
  let totalEvents = 0;
  for (const r of rows) {
    const c = r._count._all;
    byEventName[r.eventName] = c;
    totalEvents += c;
  }
  return { sinceIso: since.toISOString(), totalEvents, byEventName };
}

/** Funnel-style rates from this run’s event counts (heuristic, not cohort science). */
export function summarizeFunnelFromSnapshot(s: GrowthFunnelSnapshot): {
  listingViews: number;
  bookingSignals: number;
  checkoutOrPayment: number;
  manualOrConfirmed: number;
} {
  const g = (n: string) => s.byEventName[n] ?? 0;
  const listingViews = g("listing_viewed") + g("listings_browse_viewed");
  const bookingSignals = g("booking_request_started") + g("booking_request_submitted");
  const checkoutOrPayment = g("checkout_started") + g("payment_completed");
  const manualOrConfirmed = g("manual_payment_marked_received") + g("booking_confirmed");
  return { listingViews, bookingSignals, checkoutOrPayment, manualOrConfirmed };
}
