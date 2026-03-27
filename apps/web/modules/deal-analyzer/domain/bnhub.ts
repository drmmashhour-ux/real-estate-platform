export const BnhubShortTermRecommendation = {
  STRONG: "strong_short_term_candidate",
  MODERATE: "moderate_short_term_candidate",
  CAUTION: "caution_short_term_candidate",
  INSUFFICIENT: "insufficient_short_term_data",
} as const;
export type BnhubShortTermRecommendation =
  (typeof BnhubShortTermRecommendation)[keyof typeof BnhubShortTermRecommendation];

export type BnhubDealAnalysisResult = {
  recommendation: BnhubShortTermRecommendation;
  confidenceLevel: "low" | "medium" | "high";
  monthlyGrossRevenueCents: number | null;
  monthlyNetOperatingCents: number | null;
  nightlyRateCents: number | null;
  occupancyAssumed: number | null;
  platformFeePct: number;
  reasons: string[];
  warnings: string[];
};
