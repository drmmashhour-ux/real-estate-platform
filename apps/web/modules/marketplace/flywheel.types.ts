/**
 * Marketplace flywheel V1 — advisory insights only; no auto-spend or campaign execution.
 */

export type MarketplaceFlywheelInsightType =
  | "supply_gap"
  | "demand_gap"
  | "conversion_opportunity"
  | "broker_gap"
  | "pricing_opportunity";

export type MarketplaceFlywheelInsight = {
  id: string;
  type: MarketplaceFlywheelInsightType;
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
};
