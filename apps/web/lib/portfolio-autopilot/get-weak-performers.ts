import type { PortfolioListingSignals } from "./types";

export function getWeakPerformers(listings: PortfolioListingSignals[], limit = 5): PortfolioListingSignals[] {
  if (listings.length === 0) return [];
  return [...listings].sort((a, b) => a.rankScore - b.rankScore).slice(0, limit);
}
