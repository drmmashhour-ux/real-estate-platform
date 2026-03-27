export type BrokerPlanSlug = "free" | "pro" | "platinum";

export type BrokerEntitlements = {
  plan: BrokerPlanSlug;
  maxMarketplacePurchasesPerMonth: number;
  leadPriorityInCrm: boolean;
  premiumInsights: boolean;
};

const ENT: Record<BrokerPlanSlug, BrokerEntitlements> = {
  free: {
    plan: "free",
    maxMarketplacePurchasesPerMonth: 3,
    leadPriorityInCrm: false,
    premiumInsights: false,
  },
  pro: {
    plan: "pro",
    maxMarketplacePurchasesPerMonth: 20,
    leadPriorityInCrm: true,
    premiumInsights: true,
  },
  platinum: {
    plan: "platinum",
    maxMarketplacePurchasesPerMonth: 200,
    leadPriorityInCrm: true,
    premiumInsights: true,
  },
};

export function entitlementsForPlan(plan: BrokerPlanSlug): BrokerEntitlements {
  return ENT[plan];
}

export function normalizeBrokerPlanSlug(raw: string | null | undefined): BrokerPlanSlug {
  const s = raw?.trim().toLowerCase();
  if (s === "pro" || s === "platinum") return s;
  return "free";
}
