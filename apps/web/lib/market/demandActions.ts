import "server-only";

import type { DemandHeatmapRow } from "@/lib/market/demandHeatmap";

/**
 * Order 83 — Actionable demand intelligence: rule-based *actions* from the same
 * per-city heatmap as {@link getDemandHeatmap}. Does not mutate prices or supply;
 * pricing uses soft percentage biases only.
 */

/** "High" demand: aligned with `pressureFromScore` / city pricing tiers. */
export const DEMAND_THRESHOLD_HIGH = 100;

/** Below this, city is "low demand" for marketing rule. */
export const DEMAND_THRESHOLD_LOW = 40;

export const CONVERSION_OK = 0.05;

/** If bookings per published listing in the city is below this, suggest supply growth. */
export const BOOKINGS_PER_LISTING_MIN = 0.2;

export type DemandActionKey =
  | "increase_prices"
  | "improve_listings"
  | "boost_marketing"
  | "add_supply";

export type DemandActionCity = {
  city: string;
  demandScore: number;
  conversionRate: number;
  trend: number;
  /** Machine-readable action keys. */
  actions: string[];
};

const ACTION_LABEL: Record<DemandActionKey, string> = {
  increase_prices: "Increase prices",
  improve_listings: "Improve listings",
  boost_marketing: "Boost marketing",
  add_supply: "Add listings",
};

/**
 * High / medium / low label for admin (matches heatmap-style bands).
 */
export function demandBandFromScore(demandScore: number): "HIGH" | "MEDIUM" | "LOW" {
  if (demandScore >= 100) return "HIGH";
  if (demandScore >= 50) return "MEDIUM";
  return "LOW";
}

/**
 * @returns Trend as a fraction (e.g. 0.22 for +22% vs prior 7d).
 */
export function formatTrendDisplayFraction(trend: number): string {
  if (!Number.isFinite(trend)) return "0%";
  const pct = Math.round(trend * 1000) / 10;
  if (pct === 0) return "0%";
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}

export function labelDemandAction(key: string): string {
  return ACTION_LABEL[key as DemandActionKey] ?? key;
}

/**
 * Core rules (per city, all matching rules apply).
 * - increase_prices: high demand + healthy conversion
 * - improve_listings: high demand + poor conversion
 * - boost_marketing: low demand + negative booking trend
 * - add_supply: thin booking depth per listing
 */
export function buildActionsForRow(row: DemandHeatmapRow): string[] {
  const actions: string[] = [];

  if (row.demandScore > DEMAND_THRESHOLD_HIGH && row.conversionRate > CONVERSION_OK) {
    actions.push("increase_prices");
  } else if (row.demandScore > DEMAND_THRESHOLD_HIGH && row.conversionRate <= CONVERSION_OK) {
    actions.push("improve_listings");
  }

  if (row.demandScore < DEMAND_THRESHOLD_LOW && row.trend < 0) {
    actions.push("boost_marketing");
  }

  if (row.bookingsPerListing < BOOKINGS_PER_LISTING_MIN) {
    actions.push("add_supply");
  }

  return actions;
}

export function buildDemandActionsFromRows(rows: DemandHeatmapRow[]): DemandActionCity[] {
  return rows.map((row) => ({
    city: row.city,
    demandScore: row.demandScore,
    conversionRate: row.conversionRate,
    trend: row.trend,
    actions: buildActionsForRow(row),
  }));
}

/**
 * Soft pricing bias in **percent points** (e.g. +5), never a hard price change.
 * increase_prices → +5, boost_marketing → −5; summed and clamped to ±5 total swing from actions alone.
 */
export function getSoftPricingBiasPercent(actions: string[]): number {
  let sum = 0;
  if (actions.includes("increase_prices")) sum += 5;
  if (actions.includes("boost_marketing")) sum -= 5;
  return Math.min(5, Math.max(-5, sum));
}

export function isHighCityDemandForRanking(demandScore: number): boolean {
  return demandScore >= DEMAND_THRESHOLD_HIGH;
}

/**
 * Bias to apply in calendar / pricing for a single listing city.
 */
export function getSoftPricingBiasForCity(heatmap: DemandHeatmapRow[], city: string | null): number {
  if (!city?.trim()) return 0;
  const k = city.trim().toLowerCase();
  const row = heatmap.find((r) => r.city.trim().toLowerCase() === k);
  if (!row) return 0;
  return getSoftPricingBiasPercent(buildActionsForRow(row));
}

/**
 * All cities with action lists (read-only). Does not emit analytics — use the API
 * route or an explicit loop if you need {@link trackEvent}.
 */
export async function getDemandActions(
  getHeatmap?: () => Promise<DemandHeatmapRow[]>
): Promise<DemandActionCity[]> {
  const rows = getHeatmap
    ? await getHeatmap()
    : await (await import("@/lib/market/demandHeatmap")).getDemandHeatmap();
  return buildDemandActionsFromRows(rows);
}
