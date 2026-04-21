/**
 * Portfolio-level ESG analytics — internal modeling only.
 */

export const PORTFOLIO_ESG_DISCLAIMER = "Portfolio score is an internal analytical metric.";

export const POSITIONING_PORTFOLIO_ESG = "Optimize your entire portfolio with ESG intelligence";

export type PortfolioRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type PortfolioPropertyInput = {
  id: string;
  /** Display label (city, asset nickname, etc.) */
  label?: string;
  /** 0–100 per-property ESG / green performance score */
  esgScore: number;
  /** Property value in major currency units (same unit across portfolio) */
  propertyValue: number;
};

export type PortfolioEsgRecommendation = {
  propertyId: string;
  label?: string;
  action: string;
  /** Approximate portfolio-level score uplift if this asset reaches the modeled target band */
  expectedPortfolioImpactPoints: number;
  /** Modeled per-asset ESG gain (same units as property score) */
  expectedAssetEsgGainPoints: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
};

export type PortfolioDistributionBucket = {
  label: string;
  minScore: number;
  maxScore: number;
  count: number;
  /** Share of properties in bucket (by count) */
  sharePct: number;
};

export type PortfolioEsgResult = {
  portfolioScore: number;
  riskLevel: PortfolioRiskLevel;
  recommendations: PortfolioEsgRecommendation[];
  lowEsgPropertyIds: string[];
  distribution: PortfolioDistributionBucket[];
  /** Optional: illustrative tie-in to investment module — not a performance forecast */
  illustrativeResilienceRoiHintPercent: number | null;
  disclaimer: typeof PORTFOLIO_ESG_DISCLAIMER;
  positioning: typeof POSITIONING_PORTFOLIO_ESG;
};
