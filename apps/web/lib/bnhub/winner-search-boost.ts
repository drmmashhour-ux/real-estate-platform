import { prisma } from "@/lib/db";

const MAX_WINNER_BOOST = 18;

/**
 * Performance-based search boost from `ListingSearchMetrics` (views, bookings, CTR, conversion).
 * Capped so paid placements / growth boosts still matter. Only applies when there is enough signal.
 */
export async function getWinnerSearchBoostMapForIds(listingIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (listingIds.length === 0) return map;

  const metrics = await prisma.listingSearchMetrics.findMany({
    where: { listingId: { in: listingIds } },
    select: {
      listingId: true,
      views30d: true,
      bookings30d: true,
      conversionRate: true,
      ctr: true,
    },
  });

  for (const m of metrics) {
    const v = Math.max(0, m.views30d);
    const b = Math.max(0, m.bookings30d);
    const conv =
      m.conversionRate != null && Number.isFinite(m.conversionRate) ? Math.min(1, m.conversionRate) : v > 0
        ? Math.min(1, b / Math.max(1, v))
        : 0;
    const ctr = m.ctr != null && Number.isFinite(m.ctr) ? Math.min(0.92, m.ctr) : 0;
    if (v < 6 && b === 0) continue;

    const raw =
      Math.log1p(v) * 0.75 +
      Math.log1p(b) * 3.2 +
      conv * 11 +
      ctr * 5.5;

    map.set(m.listingId, Math.min(MAX_WINNER_BOOST, Math.max(0, raw)));
  }

  return map;
}
