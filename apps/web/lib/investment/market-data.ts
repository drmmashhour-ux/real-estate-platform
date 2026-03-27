/**
 * Mock regional benchmarks for MVP (not live market data).
 */
import type { InsightTone } from "./investment-insights";

export type MarketCity = "Montreal" | "Laval" | "Toronto" | "Vancouver";

export const MARKET_CITIES: MarketCity[] = ["Montreal", "Laval", "Toronto", "Vancouver"];

export const marketData: Record<MarketCity, { avgROI: number; riskLevel: "medium" | "high" }> = {
  Montreal: { avgROI: 7, riskLevel: "medium" },
  Laval: { avgROI: 8, riskLevel: "medium" },
  Toronto: { avgROI: 5, riskLevel: "high" },
  Vancouver: { avgROI: 4, riskLevel: "high" },
};

/** ±0.5% ROI treated as “about equal” to market average. */
const ROI_TOLERANCE = 0.5;

export type MarketComparisonLabel = "Above Market" | "Market Average" | "Below Market";

export function isMarketCity(value: string): value is MarketCity {
  return MARKET_CITIES.includes(value as MarketCity);
}

export function getMarketComparisonTone(label: MarketComparisonLabel): InsightTone {
  if (label === "Above Market") return "success";
  if (label === "Market Average") return "warning";
  return "danger";
}

/** For persisted DB strings on the dashboard. */
export function getMarketComparisonToneFromString(label: string): InsightTone {
  if (label === "Above Market") return "success";
  if (label === "Market Average") return "warning";
  return "danger";
}

/**
 * Compares deal ROI to mock regional avg ROI.
 */
export function compareDealToMarket(roi: number, city: MarketCity) {
  const { avgROI, riskLevel } = marketData[city];
  let marketComparison: MarketComparisonLabel;
  if (roi > avgROI + ROI_TOLERANCE) {
    marketComparison = "Above Market";
  } else if (roi < avgROI - ROI_TOLERANCE) {
    marketComparison = "Below Market";
  } else {
    marketComparison = "Market Average";
  }

  const marketRiskLevel = riskLevel === "medium" ? "Medium" : "High";

  const performanceVsMarket =
    marketComparison === "Above Market"
      ? "Outperforming local benchmarks"
      : marketComparison === "Below Market"
        ? "Underperforming local benchmarks"
        : "Aligned with local benchmarks";

  const insightMessage =
    marketComparison === "Above Market"
      ? `This deal performs above the average ROI for ${city}.`
      : marketComparison === "Below Market"
        ? `This deal performs below the average ROI for ${city}.`
        : `This deal is roughly in line with the average ROI for ${city}.`;

  return {
    marketComparison,
    marketRiskLevel,
    performanceVsMarket,
    insightMessage,
    avgROI,
  };
}
