/**
 * Public marketing pricing catalog — used by /pricing pages and checkout query params.
 * Amounts in USD per month unless noted.
 */

export type PricingHubId = "buyer" | "seller" | "bnhub" | "broker";
export type BillingPeriod = "monthly" | "yearly";

export type PublicPlanBadge = "most-popular" | "best-value";

export type PublicPlanDefinition = {
  id: string;
  name: string;
  description: string;
  /** Monthly price in USD; null = free */
  monthlyUsd: number | null;
  features: string[];
  badge?: PublicPlanBadge;
  /** Visually emphasized column */
  highlighted?: boolean;
};

export const YEARLY_DISCOUNT = 0.15;

export function yearlyTotalUsd(monthlyUsd: number | null): number | null {
  if (monthlyUsd == null || monthlyUsd <= 0) return null;
  return Math.round(monthlyUsd * 12 * (1 - YEARLY_DISCOUNT));
}

export function effectiveMonthlyFromYearly(monthlyUsd: number | null, billing: BillingPeriod): number | null {
  if (monthlyUsd == null || monthlyUsd <= 0) return null;
  if (billing === "monthly") return monthlyUsd;
  const y = yearlyTotalUsd(monthlyUsd);
  if (y == null) return null;
  return Math.round((y / 12) * 100) / 100;
}

export function formatUsd(amount: number | null, billing: BillingPeriod): string {
  if (amount == null || amount <= 0) return "Free";
  if (billing === "yearly") {
    const y = yearlyTotalUsd(amount);
    if (y == null) return "Free";
    return `$${y.toLocaleString()}/yr`;
  }
  return `$${amount}/mo`;
}

export function planPriceDisplay(
  plan: PublicPlanDefinition,
  billing: BillingPeriod
): { main: string; sub?: string } {
  if (plan.monthlyUsd == null || plan.monthlyUsd <= 0) return { main: "Free" };
  if (billing === "monthly") return { main: `$${plan.monthlyUsd}/mo` };
  const y = yearlyTotalUsd(plan.monthlyUsd);
  if (y == null) return { main: "Free" };
  const em = effectiveMonthlyFromYearly(plan.monthlyUsd, "yearly");
  return {
    main: `$${y.toLocaleString()}/yr`,
    sub: em != null ? `≈ $${em}/mo billed annually` : undefined,
  };
}

export function buildPlanCheckoutHref(
  hub: PricingHubId,
  planId: string,
  billing: BillingPeriod
): string {
  const params = new URLSearchParams({
    hub,
    plan: planId,
    billing,
  });
  return `/checkout/plan?${params.toString()}`;
}

export const buyerPlans: PublicPlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    description: "Search and explore listings with no commitment.",
    monthlyUsd: null,
    features: ["Search listings", "View property details", "Save favorites"],
    badge: "best-value",
  },
  {
    id: "basic",
    name: "Basic",
    description: "Reach listing parties and stay informed.",
    monthlyUsd: 49,
    features: ["Contact listing broker", "Email & in-app alerts", "Limited AI insights"],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Guided support and deeper market intelligence.",
    monthlyUsd: 99,
    features: ["Platform broker support", "Advanced AI analysis", "Deal guidance"],
    highlighted: true,
    badge: "most-popular",
  },
  {
    id: "elite",
    name: "Elite",
    description: "Priority service for active buyers.",
    monthlyUsd: 199,
    features: ["Full advisory touchpoints", "Priority broker routing", "Negotiation help"],
  },
];

export const sellerPlans: PublicPlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    description: "List with basic exposure to test the waters.",
    monthlyUsd: null,
    features: ["Create listing", "Basic exposure", "Core listing tools"],
  },
  {
    id: "standard",
    name: "Standard",
    description: "Better visibility and essential seller tooling.",
    monthlyUsd: 99,
    features: ["Improved placement", "Listing optimization tools", "Basic AI assistance"],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Premium placement and pricing intelligence.",
    monthlyUsd: 199,
    features: ["Premium placement", "AI pricing help", "Performance analytics"],
    highlighted: true,
    badge: "most-popular",
  },
  {
    id: "premium",
    name: "Premium",
    description: "Maximum reach with broker collaboration options.",
    monthlyUsd: 399,
    features: ["Featured listing slots", "Broker collaboration", "Full listing optimization"],
    badge: "best-value",
  },
];

export const bnhubHostPlans: PublicPlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    description: "List your stay and pay standard booking fees only.",
    monthlyUsd: null,
    features: ["Host dashboard", "Calendar & requests", "Standard search placement"],
    badge: "best-value",
  },
  {
    id: "pro",
    name: "Pro",
    description: "Grow visibility with analytics.",
    monthlyUsd: 29,
    features: ["Ranking boost", "Listing analytics", "Performance insights"],
    highlighted: true,
    badge: "most-popular",
  },
  {
    id: "elite",
    name: "Elite",
    description: "Maximum visibility and AI-assisted pricing.",
    monthlyUsd: 79,
    features: ["Priority placement", "AI pricing suggestions", "Premium host badge"],
  },
];

export const brokerPlans: PublicPlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    description: "Start receiving platform leads.",
    monthlyUsd: null,
    features: ["Basic lead inbox", "CRM essentials", "Standard notifications"],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Higher volume and better placement.",
    monthlyUsd: 99,
    features: ["More lead allocation", "Priority in rotation", "Team analytics"],
    highlighted: true,
    badge: "most-popular",
  },
  {
    id: "elite",
    name: "Elite",
    description: "For top producers who need the funnel.",
    monthlyUsd: 299,
    features: ["Priority leads", "Advanced analytics", "Dedicated success check-ins"],
    badge: "best-value",
  },
];

export function planCtaLabel(plan: PublicPlanDefinition): string {
  if (plan.monthlyUsd == null || plan.monthlyUsd <= 0) return "Start free";
  return "Upgrade";
}

const PLANS_BY_HUB: Record<PricingHubId, PublicPlanDefinition[]> = {
  buyer: buyerPlans,
  seller: sellerPlans,
  bnhub: bnhubHostPlans,
  broker: brokerPlans,
};

export function plansForHub(hub: PricingHubId): PublicPlanDefinition[] {
  return PLANS_BY_HUB[hub];
}

export function resolvePlanLabel(hub: PricingHubId, planId: string): string | null {
  const p = PLANS_BY_HUB[hub].find((x) => x.id === planId);
  return p?.name ?? null;
}

export function isValidPlanSelection(hub: string | null, planId: string | null): hub is PricingHubId {
  if (!hub || !planId) return false;
  if (hub !== "buyer" && hub !== "seller" && hub !== "bnhub" && hub !== "broker") return false;
  return PLANS_BY_HUB[hub].some((p) => p.id === planId);
}

export const HUB_DISPLAY_NAME: Record<PricingHubId, string> = {
  buyer: "Buyer",
  seller: "Seller",
  bnhub: "BNHUB host",
  broker: "Broker",
};
