import type { FinancialPeriod } from "./financial-model-types";
import { getTotalPlatformRevenueCents } from "./metrics";
import { getYearlyCosts } from "./costs";

export type GrowthProjection = {
  year: number;
  label: string;
  multiplier: number;
  projectedRevenueCents: number;
  projectedCostCents: number;
  projectedProfitCents: number;
  growthPctFromPrior: number | null;
};

const DEFAULT_MULTIPLIERS: Record<number, number> = {
  1: 1,
  2: 3,
  3: 6,
};

/**
 * Scales current annualized run-rate revenue by multiplier; costs scale sublinearly (sqrt) by default.
 */
export async function projectGrowth(
  basePeriod: FinancialPeriod,
  options?: { yearMultipliers?: Record<number, number> }
): Promise<GrowthProjection[]> {
  const baseRevenue = await getTotalPlatformRevenueCents(basePeriod);
  const ms = basePeriod.end.getTime() - basePeriod.start.getTime();
  const yearFrac = ms / (365.25 * 86400 * 1000);
  const annualizedRevenue = yearFrac > 0 ? Math.round(baseRevenue / yearFrac) : baseRevenue;

  const yearCosts = getYearlyCosts().totalCents;
  const multipliers = { ...DEFAULT_MULTIPLIERS, ...options?.yearMultipliers };

  const out: GrowthProjection[] = [];
  let priorRev: number | null = null;

  for (let y = 1; y <= 3; y++) {
    const mult = multipliers[y] ?? DEFAULT_MULTIPLIERS[y] ?? 1;
    const projectedRevenueCents = Math.round(annualizedRevenue * mult);
    const costScale = 1 + (Math.sqrt(mult) - 1) * 0.55;
    const projectedCostCents = Math.round(yearCosts * costScale);
    const projectedProfitCents = projectedRevenueCents - projectedCostCents;
    const growthPctFromPrior =
      priorRev != null && priorRev > 0 ? ((projectedRevenueCents - priorRev) / priorRev) * 100 : null;
    priorRev = projectedRevenueCents;

    const startYear = basePeriod.start.getFullYear();
    out.push({
      year: startYear + y - 1,
      label: y === 1 ? "Year 1 (base run-rate)" : y === 2 ? "Year 2 (×3 revenue)" : "Year 3 (×6 revenue)",
      multiplier: mult,
      projectedRevenueCents,
      projectedCostCents,
      projectedProfitCents,
      growthPctFromPrior,
    });
  }

  return out;
}
