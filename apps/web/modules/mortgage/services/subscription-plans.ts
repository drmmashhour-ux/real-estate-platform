/** Defaults when creating or upgrading expert subscription tiers (price = list amount in cents CAD). */
export const MORTGAGE_SUBSCRIPTION_PLANS = {
  basic: { maxLeadsPerDay: 5, maxLeadsPerMonth: 10, priorityWeight: 0, price: 4_900 },
  pro: { maxLeadsPerDay: 15, maxLeadsPerMonth: 50, priorityWeight: 1, price: 9_900 },
  premium: { maxLeadsPerDay: 50, maxLeadsPerMonth: -1, priorityWeight: 3, price: 29_900 },
  ambassador: { maxLeadsPerDay: 80, maxLeadsPerMonth: -1, priorityWeight: 5, price: 49_900 },
} as const;

export type MortgageSubscriptionPlanName = keyof typeof MORTGAGE_SUBSCRIPTION_PLANS;

export function getMortgagePlanDefaults(plan: string): (typeof MORTGAGE_SUBSCRIPTION_PLANS)[MortgageSubscriptionPlanName] {
  const p = plan.toLowerCase().trim();
  if (p === "ambassador") return MORTGAGE_SUBSCRIPTION_PLANS.ambassador;
  if (p === "premium") return MORTGAGE_SUBSCRIPTION_PLANS.premium;
  if (p === "pro") return MORTGAGE_SUBSCRIPTION_PLANS.pro;
  return MORTGAGE_SUBSCRIPTION_PLANS.basic;
}

/** Higher rank = served first when sorting assignable experts (ambassador > premium > pro > basic). */
export function mortgagePlanTierRank(plan: string): number {
  const p = plan.toLowerCase().trim();
  if (p === "ambassador") return 4;
  if (p === "premium") return 3;
  if (p === "pro") return 2;
  return 1;
}
