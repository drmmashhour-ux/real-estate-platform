/** Deterministic deal engine — confidence-aware; not an appraisal. */

export type DealCategory = "bad" | "average" | "good" | "excellent";

export type DealRecommendationBand =
  | "insufficient_data"
  | "caution"
  | "worth_reviewing"
  | "strong_opportunity"
  | "avoid";

export type DealScoreResult = {
  dealScore: number;
  dealScoreRaw: number;
  riskAdjustedDealScore: number;
  dealConfidence: number;
  category: DealCategory;
  recommendation: DealRecommendationBand;
  riskScore: number;
  /** Persisted analyzer recommendation string */
  analyzerRecommendation: string;
  /** Deterministic engine warnings (safe for UI) */
  warnings?: string[];
};
