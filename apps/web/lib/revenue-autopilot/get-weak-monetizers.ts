import type { RevenueListingContext } from "./types";

/** Low revenue per view — candidates for conversion work. */
export function getWeakMonetizers(listings: RevenueListingContext[], limit = 6): RevenueListingContext[] {
  if (listings.length === 0) return [];
  return [...listings]
    .map((l) => ({
      l,
      rpm: l.views30d > 8 ? l.revenue90dCents / l.views30d : l.revenue90dCents,
    }))
    .sort((a, b) => a.rpm - b.rpm)
    .slice(0, limit)
    .map((x) => x.l);
}
