import type { PortfolioListingSignals } from "./types";

export function getTopPerformers(listings: PortfolioListingSignals[], limit = 5): PortfolioListingSignals[] {
  if (listings.length === 0) return [];
  return [...listings].sort((a, b) => b.rankScore - a.rankScore).slice(0, limit);
}
