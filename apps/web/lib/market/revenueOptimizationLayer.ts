/**
 * Revenue optimization — additive factors on base nightly price (Order 62).
 *
 * ```
 * price = basePrice * (1 + demandFactor + weekendFactor + seasonFactor + occupancyFactor)
 * ```
 *
 * Example (before clamp): high demand +10%, weekend +8%, occupancy &gt; 80% +12%.
 * **Clamp** on the **sum** of factors: min **-10%**, max **+30%** (investor spec).
 *
 * When `FEATURE_REVENUE_OPTIMIZATION_LAYER` is off, {@link computeDailyListingPricing}
 * uses the legacy `totalAdjustmentPercent` path (unchanged).
 */
import type { SeasonType } from "@/lib/market/seasonRules";
import type { DayType, DemandPressure } from "@/lib/market/seasonalPricingMath";

/** Sum of fractional factors before `1 + sum` (e.g. 0.10 = +10%). */
export const REVENUE_FACTOR_CLAMP = {
  min: -0.1,
  max: 0.3,
} as const;

const DEMAND_FR: Record<DemandPressure, number> = {
  high: 0.1,
  medium: 0.05,
  low: 0,
};

function weekendFactor(dayType: DayType): number {
  return dayType === "weekend" ? 0.08 : 0;
}

function seasonFactor(season: SeasonType): number {
  if (season === "high_season") return 0.12;
  if (season === "low_season") return -0.07;
  return 0;
}

/** Occupancy &gt; 80% → +12% (listing or market proxy 0–1). */
export function occupancyFactor(occupancyRatio: number | null | undefined): number {
  if (occupancyRatio == null || !Number.isFinite(occupancyRatio)) return 0;
  return occupancyRatio > 0.8 ? 0.12 : 0;
}

function clampFactorSum(raw: number): number {
  return Math.min(REVENUE_FACTOR_CLAMP.max, Math.max(REVENUE_FACTOR_CLAMP.min, raw));
}

export type RevenueOptimizationBreakdown = {
  /** Applied multiplier on base (e.g. 1.15). */
  multiplier: number;
  /** Total % change for display (e.g. 15). */
  adjustmentPercentRounded: number;
  demandFactor: number;
  weekendFactor: number;
  seasonFactor: number;
  occupancyFactor: number;
  /** Sum of factors after clamp. */
  factorSumClamped: number;
};

/**
 * Computes the revenue-optimized multiplier from the same signals as calendar pricing.
 * `occupancyRatio` is optional (e.g. share of nights booked in the requested range); omit for 0 occupancy uplift.
 */
export function computeRevenueOptimizationMultiplier(input: {
  basePrice: number;
  dayType: DayType;
  seasonType: SeasonType;
  demandLevel: DemandPressure;
  occupancyRatio?: number | null;
}): RevenueOptimizationBreakdown {
  const demand = DEMAND_FR[input.demandLevel];
  const wk = weekendFactor(input.dayType);
  const seas = seasonFactor(input.seasonType);
  const occ = occupancyFactor(input.occupancyRatio);
  const rawSum = demand + wk + seas + occ;
  const factorSumClamped = clampFactorSum(rawSum);
  const multiplier = 1 + factorSumClamped;
  const bp = input.basePrice;
  const validBase = Number.isFinite(bp) && bp >= 0;
  const adjustmentPercentRounded = Math.round(factorSumClamped * 100);
  return {
    multiplier: validBase ? multiplier : 1,
    adjustmentPercentRounded,
    demandFactor: demand,
    weekendFactor: wk,
    seasonFactor: seas,
    occupancyFactor: occ,
    factorSumClamped,
  };
}

/** Short UI/admin sentence for the revenue path (replaces legacy `buildReason` text). */
export function formatRevenueOptimizationReason(b: RevenueOptimizationBreakdown): string {
  const parts: string[] = [];
  if (b.demandFactor > 0) parts.push("demand");
  if (b.weekendFactor > 0) parts.push("weekend");
  if (b.seasonFactor > 0) parts.push("high season");
  else if (b.seasonFactor < 0) parts.push("low season");
  if (b.occupancyFactor > 0) parts.push("high occupancy");
  const tail = parts.length ? parts.join(", ") : "baseline";
  return `Revenue layer: ${tail} (${b.adjustmentPercentRounded >= 0 ? "+" : ""}${b.adjustmentPercentRounded}%).`;
}
