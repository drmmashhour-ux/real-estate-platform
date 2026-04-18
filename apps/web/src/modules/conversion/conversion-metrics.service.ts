import { prisma } from "@/lib/db";

/**
 * Rollup conversion proxies from `EventLog` (best-effort; sparse data → zeros).
 *
 * Definitions (documented for admin parity):
 * - ctr: listing_click / listing_impression — requires impressions to be logged on recommendation/feed surfaces.
 *   If impressions are under-counted, CTR is overstated — keep `listing_impression` consistent with visible cards.
 * - saveRateOfClicks: listing_save / listing_click — saves among users who clicked.
 * - inquiryRateOfClicks: inquiry_submit / listing_click — inquiries among clickers.
 * - bookingStartRateOfClicks: booking_start / listing_click — same denominator for comparability.
 * - bookingCompleteRateOfStarts: booking_complete / booking_start — funnel close.
 */
export async function getEventLogConversionRollup(since: Date) {
  const types = [
    "listing_impression",
    "listing_click",
    "listing_save",
    "inquiry_submit",
    "booking_start",
    "booking_complete",
  ] as const;
  const rows = await prisma.eventLog.groupBy({
    by: ["eventType"],
    where: { createdAt: { gte: since }, eventType: { in: [...types] } },
    _count: { _all: true },
  });
  const m = Object.fromEntries(rows.map((r) => [r.eventType, r._count._all])) as Record<string, number>;
  const imp = m.listing_impression ?? 0;
  const clk = m.listing_click ?? 0;
  const sav = m.listing_save ?? 0;
  const inq = m.inquiry_submit ?? 0;
  const bst = m.booking_start ?? 0;
  const bcmp = m.booking_complete ?? 0;
  return {
    since: since.toISOString(),
    counts: m,
    rates: {
      ctr: imp > 0 ? clk / imp : 0,
      /** Alias: saves / clicks (not saves / impressions). */
      saveRate: clk > 0 ? sav / clk : 0,
      saveRateOfClicks: clk > 0 ? sav / clk : 0,
      inquiryRate: clk > 0 ? inq / clk : 0,
      bookingStartRate: clk > 0 ? bst / clk : 0,
      bookingCompleteRate: bst > 0 ? bcmp / bst : 0,
    },
  };
}
