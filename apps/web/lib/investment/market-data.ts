/**
 * Mock regional benchmarks for MVP (not live market data).
 * Cities are Québec-wide; unknown localities use a provincial default.
 */
import type { InsightTone } from "./investment-insights";
import { isMarketCity, type MarketCity, MARKET_CITIES } from "./quebec-cities";

export { isMarketCity, MARKET_CITIES, type MarketCity } from "./quebec-cities";
export { QUEBEC_CITY_GROUPS, type QuebecRegionGroup } from "./quebec-cities";

/** Explicit mock benchmarks for major centres; all other Québec cities use QUEBEC_DEFAULT. */
const METRO_BENCHMARK: Record<string, { avgROI: number; riskLevel: "medium" | "high" }> = {
  Montréal: { avgROI: 7, riskLevel: "medium" },
  Laval: { avgROI: 8, riskLevel: "medium" },
  Longueuil: { avgROI: 7, riskLevel: "medium" },
  Québec: { avgROI: 7, riskLevel: "medium" },
  Lévis: { avgROI: 7, riskLevel: "medium" },
  Gatineau: { avgROI: 6, riskLevel: "high" },
  Sherbrooke: { avgROI: 7, riskLevel: "medium" },
  Saguenay: { avgROI: 6.5, riskLevel: "medium" },
  "Trois-Rivières": { avgROI: 7, riskLevel: "medium" },
  Drummondville: { avgROI: 7, riskLevel: "medium" },
  Granby: { avgROI: 7, riskLevel: "medium" },
  "Saint-Jérôme": { avgROI: 7, riskLevel: "medium" },
  Joliette: { avgROI: 7, riskLevel: "medium" },
  Victoriaville: { avgROI: 7, riskLevel: "medium" },
  "Rouyn-Noranda": { avgROI: 5.5, riskLevel: "medium" },
  "Val-d'Or": { avgROI: 5.5, riskLevel: "medium" },
  Amos: { avgROI: 5.5, riskLevel: "medium" },
  "Sept-Îles": { avgROI: 5, riskLevel: "medium" },
  "Baie-Comeau": { avgROI: 5.5, riskLevel: "medium" },
  Matane: { avgROI: 5.5, riskLevel: "medium" },
  Rimouski: { avgROI: 6, riskLevel: "medium" },
  Gaspé: { avgROI: 4.5, riskLevel: "medium" },
  Percé: { avgROI: 4.5, riskLevel: "medium" },
  Alma: { avgROI: 6.5, riskLevel: "medium" },
  Roberval: { avgROI: 5.5, riskLevel: "medium" },
  Shawinigan: { avgROI: 6.5, riskLevel: "medium" },
  "La Tuque": { avgROI: 5, riskLevel: "medium" },
  Magog: { avgROI: 7, riskLevel: "medium" },
  Coaticook: { avgROI: 6.5, riskLevel: "medium" },
  Bécancour: { avgROI: 6.5, riskLevel: "medium" },
  Mirabel: { avgROI: 7, riskLevel: "medium" },
  Blainville: { avgROI: 7, riskLevel: "medium" },
  Repentigny: { avgROI: 7, riskLevel: "medium" },
  Terrebonne: { avgROI: 7, riskLevel: "medium" },
};

const QUEBEC_DEFAULT = { avgROI: 6.5, riskLevel: "medium" as const };

/** @deprecated Use getMarketBenchmarkForCity — kept for any code expecting a Record */
export const marketData: Record<string, { avgROI: number; riskLevel: "medium" | "high" }> = METRO_BENCHMARK;

export function getMarketBenchmarkForCity(city: string): { avgROI: number; riskLevel: "medium" | "high" } {
  return METRO_BENCHMARK[city] ?? QUEBEC_DEFAULT;
}

/** Map legacy persisted / English labels to current catalog names. */
const LEGACY_CITY_ALIASES: Record<string, string> = {
  Montreal: "Montréal",
  "Quebec City": "Québec",
  Quebec: "Québec",
  Laval: "Laval",
  Toronto: "Montréal",
  Vancouver: "Montréal",
};

export function normalizeLegacyMarketCity(value: string): MarketCity {
  const t = value.trim();
  if (isMarketCity(t)) return t;
  const mapped = LEGACY_CITY_ALIASES[t];
  if (mapped && isMarketCity(mapped)) return mapped;
  return "Montréal";
}

/** Strict resolution for API: unknown labels return null (do not silently default). */
export function resolveMarketCityInput(value: string): MarketCity | null {
  const t = value.trim();
  if (isMarketCity(t)) return t;
  const mapped = LEGACY_CITY_ALIASES[t];
  if (mapped && isMarketCity(mapped)) return mapped;
  return null;
}

/** ±0.5% ROI treated as “about equal” to market average. */
const ROI_TOLERANCE = 0.5;

export type MarketComparisonLabel = "Above Market" | "Market Average" | "Below Market";

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
  const { avgROI, riskLevel } = getMarketBenchmarkForCity(city);
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
