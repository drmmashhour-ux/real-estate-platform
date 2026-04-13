import type { RevenueListingContext } from "./types";

export function getTopEarners(listings: RevenueListingContext[], limit = 8): RevenueListingContext[] {
  if (listings.length === 0) return [];
  return [...listings].sort((a, b) => b.revenue90dCents - a.revenue90dCents).slice(0, limit);
}
