/**
 * Pricing Engine v2 — structured recommendation DTO (major currency units for display).
 * Never auto-applied; not an appraisal or external market claim.
 */

export type PriceScenarioV2 = {
  key: "conservative" | "balanced" | "aggressive";
  label: string;
  recommendedPrice: number;
  minPrice: number;
  maxPrice: number;
};

export type RecommendPriceV2Result = {
  listingType: "fsbo" | "bnhub";
  currencyHint: string;
  recommendedPrice: number;
  minPrice: number;
  maxPrice: number;
  confidence: number;
  comparableCount: number;
  marketMedian: number | null;
  marketP25: number | null;
  marketP75: number | null;
  expectedImpact: {
    revenue: string;
    visibility: string;
    competitiveness: string;
  };
  scores: {
    priceCompetitivenessScore: number;
    demandStrengthScore: number;
    listingStrengthScore: number;
  };
  scenarios: {
    conservative: PriceScenarioV2;
    balanced: PriceScenarioV2;
    aggressive: PriceScenarioV2;
  };
  reasoning: string[];
  warnings: string[];
  lowConfidence: boolean;
  /** When true, UI should emphasize keeping the current published price until data improves. */
  preserveCurrentPrice: boolean;
  currentPrice: number;
};

export type RecommendPriceV2Input =
  | { listingType: "fsbo"; listingId: string }
  | { listingType: "bnhub"; listingId: string };
