import { revenueV4Flags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { BookingStatus } from "@prisma/client";
import { logRevenueEngineV4Event } from "@/src/modules/revenue/revenue.logger";

export type BnhubRevMetrics = {
  listingId: string;
  windowDays: number;
  /** Booked nights in window (completed stays). */
  bookedNights: number;
  /** Gross booking value (totalCents) completed in window. */
  revenueCents: number;
  /** revenue / calendar days — rough proxy when calendar inventory unknown. */
  revenuePerCalendarDayCents: number;
  /** Booked nights / (windowDays * unit=1) — illustrative only. */
  occupancyApprox: number;
  /** revenue / max(1, bookedNights) — average nightly booking value. */
  revenuePerBookedNightCents: number;
  /** RevPAN-style: revenue / (windowDays * 1); not RevPAR without OTA inventory. */
  revPanApproxCents: number;
  confidenceNote: string;
};

/**
 * Observable booking aggregates — explicitly not a substitute for channel-manager RevPAR.
 */
export async function computeBnhubListingRevMetrics(
  listingId: string,
  windowDays = 30,
): Promise<BnhubRevMetrics | null> {
  if (!revenueV4Flags.bnhubDynamicPricingV1) return null;

  const since = new Date(Date.now() - windowDays * 86400000);
  const bookings = await prisma.booking.findMany({
    where: {
      listingId,
      status: BookingStatus.COMPLETED,
      checkOut: { gte: since },
    },
    select: { nights: true, totalCents: true },
  });

  const bookedNights = bookings.reduce((s, b) => s + b.nights, 0);
  const revenueCents = bookings.reduce((s, b) => s + b.totalCents, 0);
  const revenuePerBookedNightCents = bookedNights > 0 ? Math.round(revenueCents / bookedNights) : 0;
  const revenuePerCalendarDayCents = Math.round(revenueCents / windowDays);
  const occupancyApprox = Math.min(1, bookedNights / (windowDays * 1));
  const revPanApproxCents = Math.round(revenueCents / windowDays);

  const out: BnhubRevMetrics = {
    listingId,
    windowDays,
    bookedNights,
    revenueCents,
    revenuePerCalendarDayCents,
    occupancyApprox,
    revenuePerBookedNightCents,
    revPanApproxCents,
    confidenceNote:
      "Approximate metrics from platform bookings only; external calendar blocks not modeled — use for trends, not GAAP revenue.",
  };

  await logRevenueEngineV4Event({
    engine: "bnhub_pricing",
    action: "compute_rev_metrics",
    entityType: "short_term_listing",
    entityId: listingId,
    outputJson: out as unknown as Record<string, unknown>,
    confidence: bookings.length >= 3 ? 70 : 35,
    explanation: out.confidenceNote,
  });

  return out;
}
