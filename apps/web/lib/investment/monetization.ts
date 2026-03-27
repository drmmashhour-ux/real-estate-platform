/**
 * Investment MVP monetization — Free vs Pro (soft limits, no payment yet).
 */

/** Max saved deals for non-Pro accounts (logged-in). Demo/local saves are unlimited. */
export const INVESTMENT_FREE_DEAL_LIMIT = 3;

/** Pro plan unlocks unlimited saves + positioning for advanced features. */
export const INVESTMENT_PRO_PLAN = "pro";

export function isInvestmentProPlan(plan: string | null | undefined): boolean {
  return (plan ?? "").toLowerCase() === INVESTMENT_PRO_PLAN;
}

export function maxSavedDealsForPlan(plan: string | null | undefined): number {
  return isInvestmentProPlan(plan) ? Number.POSITIVE_INFINITY : INVESTMENT_FREE_DEAL_LIMIT;
}

export function canSaveMoreDeals(plan: string | null | undefined, currentCount: number): boolean {
  const max = maxSavedDealsForPlan(plan);
  return currentCount < max;
}

export const INVESTMENT_LIMIT_MESSAGE =
  "Upgrade to Pro to save more deals and unlock full features";

export const PRO_VALUE_LINES = {
  serious: "Serious investors use Pro tools",
  unlock: "Unlock full investment insights",
} as const;

export type InvestmentMonetizationSnapshot = {
  plan: string;
  savedDealCount: number;
  maxFreeDeals: number;
  isPro: boolean;
  canSaveMore: boolean;
  /** True when at or over free cap (only relevant when !isPro) */
  isAtOrOverFreeLimit: boolean;
};

export function buildMonetizationSnapshot(
  plan: string | null | undefined,
  savedDealCount: number
): InvestmentMonetizationSnapshot {
  const p = plan ?? "free";
  const isPro = isInvestmentProPlan(p);
  const maxFreeDeals = INVESTMENT_FREE_DEAL_LIMIT;
  const canSaveMore = canSaveMoreDeals(p, savedDealCount);
  const isAtOrOverFreeLimit = !isPro && savedDealCount >= maxFreeDeals;

  return {
    plan: p,
    savedDealCount,
    maxFreeDeals,
    isPro,
    canSaveMore,
    isAtOrOverFreeLimit,
  };
}
