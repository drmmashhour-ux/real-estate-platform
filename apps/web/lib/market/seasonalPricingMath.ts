import { getSeasonTypeForDate, type SeasonType } from "@/lib/market/seasonRules";
import { flags } from "@/lib/flags";
import {
  computeRevenueOptimizationMultiplier,
  formatRevenueOptimizationReason,
  REVENUE_FACTOR_CLAMP,
} from "@/lib/market/revenueOptimizationLayer";

const WEEKEND_PCT = 8;
const HIGH_SEASON_PCT = 12;
const LOW_SEASON_PCT = -7;
const DEMAND_HIGH_PCT = 10;
const DEMAND_MEDIUM_PCT = 5;
const DEMAND_LOW_PCT = 0;

const ADJ_MIN = -10;
const ADJ_MAX = 25;

export type DayType = "weekday" | "weekend";
export type DemandPressure = "low" | "medium" | "high";

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function pressureFromScore(demandScore: number): DemandPressure {
  if (demandScore >= 100) return "high";
  if (demandScore >= 50) return "medium";
  return "low";
}

function demandPercent(p: DemandPressure): number {
  if (p === "high") return DEMAND_HIGH_PCT;
  if (p === "medium") return DEMAND_MEDIUM_PCT;
  return DEMAND_LOW_PCT;
}

function seasonPercent(season: SeasonType): number {
  if (season === "high_season") return HIGH_SEASON_PCT;
  if (season === "low_season") return LOW_SEASON_PCT;
  return 0;
}

function clampAdjustment(raw: number): number {
  return Math.min(ADJ_MAX, Math.max(ADJ_MIN, Math.round(raw)));
}

function buildReason(dayType: DayType, season: SeasonType, pressure: DemandPressure): string {
  const parts: string[] = [];
  if (dayType === "weekend") parts.push("Weekend");
  if (season === "high_season") parts.push("high season");
  if (season === "low_season") parts.push("low season");
  if (pressure === "high") parts.push("high demand pressure");
  else if (pressure === "medium") parts.push("medium demand pressure");
  else parts.push("low demand pressure");

  if (parts.length === 1) {
    const only = parts[0];
    return `${only.charAt(0).toUpperCase() + only.slice(1)} detected.`;
  }
  if (parts.length === 2) {
    return `${parts[0].charAt(0).toUpperCase() + parts[0].slice(1)} and ${parts[1]} detected.`;
  }
  const [first, ...rest] = parts;
  const last = rest.pop()!;
  return `${first.charAt(0).toUpperCase() + first.slice(1)}, ${rest.join(", ")}, and ${last} detected.`;
}

export function totalAdjustmentPercent(
  dayType: DayType,
  season: SeasonType,
  pressure: DemandPressure
): { rounded: number; reason: string } {
  const raw =
    (dayType === "weekend" ? WEEKEND_PCT : 0) + seasonPercent(season) + demandPercent(pressure);
  return {
    rounded: clampAdjustment(raw),
    reason: buildReason(dayType, season, pressure),
  };
}

/**
 * Order A.2 / same % rules as `getSeasonalPricingRecommendations` (db-free).
 */
export function computeDailyListingPricing(input: {
  basePrice: number;
  dateYmd: string;
  city: string | null;
  cityDemandScore: number;
  /**
   * Order 83 — extra ±5% *soft* points from {@link getSoftPricingBiasPercent} (demand actions).
   * Does not change stored `nightPriceCents`; only suggested calendar output.
   */
  demandActionSoftBiasPercent?: number;
  /**
   * Share of booked nights in the visible range (0–1). When `FEATURE_REVENUE_OPTIMIZATION_LAYER=1`, values &gt; 0.8 add +12%.
   * Ignored when the flag is off.
   */
  occupancyRatio?: number | null;
}): {
  dayType: DayType;
  seasonType: SeasonType;
  demandLevel: DemandPressure;
  adjustmentPercent: number;
  basePrice: number;
  suggestedPrice: number | null;
  reason: string;
} {
  const s = input.dateYmd.trim().slice(0, 10);
  const parts = s.split("-").map((x) => Number(x));
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  const date = Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d) ? new Date(y, m - 1, d) : new Date();
  const dayType: DayType = isWeekend(date) ? "weekend" : "weekday";
  const season = getSeasonTypeForDate(date);
  const pressure = pressureFromScore(input.cityDemandScore);
  const bp = input.basePrice;
  const validBase = Number.isFinite(bp) && bp >= 0;

  const actionBias = input.demandActionSoftBiasPercent ?? 0;
  const actionBiasFr = actionBias / 100;

  if (flags.REVENUE_OPTIMIZATION_LAYER) {
    const ro = computeRevenueOptimizationMultiplier({
      basePrice: bp,
      dayType,
      seasonType: season,
      demandLevel: pressure,
      occupancyRatio: input.occupancyRatio,
    });
    const factorWithBias = Math.min(
      REVENUE_FACTOR_CLAMP.max,
      Math.max(REVENUE_FACTOR_CLAMP.min, ro.factorSumClamped + actionBiasFr)
    );
    const multiplier = 1 + factorWithBias;
    const adjRounded = Math.round(factorWithBias * 100);
    const suggestedPrice = validBase ? Math.round(bp * multiplier * 100) / 100 : null;
    const baseReason = formatRevenueOptimizationReason(ro);
    const reason =
      actionBias !== 0
        ? `${baseReason} · City demand action bias: ${actionBias > 0 ? "+" : ""}${actionBias}%.`
        : baseReason;
    return {
      dayType,
      seasonType: season,
      demandLevel: pressure,
      adjustmentPercent: adjRounded,
      basePrice: validBase ? bp : 0,
      suggestedPrice,
      reason,
    };
  }

  const { rounded, reason: baseReason } = totalAdjustmentPercent(dayType, season, pressure);
  const roundedWithBias = clampAdjustment(rounded + actionBias);
  const suggestedPrice = validBase
    ? Math.round(bp * (1 + roundedWithBias / 100) * 100) / 100
    : null;
  const reason =
    actionBias !== 0
      ? `${baseReason} City demand action bias: ${actionBias > 0 ? "+" : ""}${actionBias}%.`
      : baseReason;
  return {
    dayType,
    seasonType: season,
    demandLevel: pressure,
    adjustmentPercent: roundedWithBias,
    basePrice: validBase ? bp : 0,
    suggestedPrice,
    reason,
  };
}

export function toYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

export function isLocalWeekend(d: Date): boolean {
  return isWeekend(d);
}
