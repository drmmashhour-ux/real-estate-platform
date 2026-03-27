import type { FinancialPeriod } from "./financial-model-types";
import type { ProfitResult } from "./financial-model-types";
import { getMonthlyCosts, getYearlyCosts } from "./costs";
import { getTotalPlatformRevenueCents } from "./metrics";

export type ProfitPeriodKind = "monthly" | "yearly" | "custom";

/**
 * Revenue for period (calendar month or year or custom range) vs prorated costs.
 */
export async function getTotalRevenue(period: FinancialPeriod): Promise<number> {
  return getTotalPlatformRevenueCents(period);
}

export function getTotalCosts(periodKind: ProfitPeriodKind): number {
  if (periodKind === "yearly") return getYearlyCosts().totalCents;
  return getMonthlyCosts().totalCents;
}

/**
 * For custom range, prorate monthly costs by day count / ~30.44.
 */
export function getCostsForRange(period: FinancialPeriod): number {
  const ms = period.end.getTime() - period.start.getTime();
  const days = Math.max(1, ms / (86400 * 1000));
  const monthly = getMonthlyCosts().totalCents;
  return Math.round((monthly * days) / 30.44);
}

export async function getProfit(period: FinancialPeriod, periodKind: ProfitPeriodKind = "custom"): Promise<ProfitResult> {
  const revenueCents = await getTotalRevenue(period);
  let costCents: number;
  if (periodKind === "monthly") costCents = getMonthlyCosts().totalCents;
  else if (periodKind === "yearly") costCents = getYearlyCosts().totalCents;
  else costCents = getCostsForRange(period);

  const netProfitCents = revenueCents - costCents;
  const marginPct = revenueCents > 0 ? (netProfitCents / revenueCents) * 100 : null;
  return { revenueCents, costCents, netProfitCents, marginPct };
}
