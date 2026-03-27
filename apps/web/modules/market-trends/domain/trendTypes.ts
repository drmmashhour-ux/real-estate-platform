/** Conservative trend labels — not appraisals or guaranteed returns. */
export type TrendDirectionLabel = "upward_pressure" | "neutral" | "downward_pressure" | "insufficient_data";

export type TrendConfidenceLevel = "insufficient_data" | "low" | "medium" | "high";

export type MarketTrendSummary = {
  direction: TrendDirectionLabel;
  confidence: TrendConfidenceLevel;
  safeSummary: string;
  warnings: string[];
};
