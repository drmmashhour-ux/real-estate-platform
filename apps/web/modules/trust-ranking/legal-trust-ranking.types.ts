/**
 * Bounded legal + trust marketplace ranking adjustments — deterministic only.
 */

export type LegalTrustRankingImpact = {
  listingId: string;
  trustBoost: number;
  legalRiskMultiplier: number;
  finalMultiplier: number;
  exposureLevel: "restricted" | "normal" | "boosted";
  reasons: string[];
};

export type RankingDecisionSummary = {
  listingId: string;
  baseScore: number;
  finalScore: number;
  impact: LegalTrustRankingImpact;
};
