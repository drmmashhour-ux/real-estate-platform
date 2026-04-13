/** Enriched BNHub stay row for portfolio ranking (host-owned listings). */
export type PortfolioListingSignals = {
  id: string;
  listingCode: string;
  title: string;
  city: string;
  qualityScore: number;
  contentScore: number;
  pricingScore: number;
  performanceScore: number;
  behaviorScore: number;
  trustScore: number;
  views30d: number;
  ctr: number | null;
  conversionRate: number | null;
  /** 0–1 composite for ordering top/weak */
  rankScore: number;
};
