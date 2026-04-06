/**
 * Product-facing marketplace tiers (FREE / PRO / PLATINUM). Billing hooks elsewhere; this is the config + UI contract.
 */
export type MarketplaceSubscriptionTierKey = "FREE" | "PRO" | "PLATINUM";

export type MarketplaceTierDefinition = {
  key: MarketplaceSubscriptionTierKey;
  label: string;
  /** Featured placement credits per billing month (0 = none). */
  featuredCreditsPerMonth: number;
  /** Full demand / funnel analytics in seller dashboards. */
  analyticsFull: boolean;
  /** Broker workspace tools (CRM-adjacent). */
  brokerTools: boolean;
  /** Priority ordering weight boost in browse (0–1, applied as fractional bump in ranking helpers). */
  priorityVisibilityBoost: number;
  monthlyCents: number;
  listingCap: number;
};

export const MARKETPLACE_SUBSCRIPTION_TIERS: Record<MarketplaceSubscriptionTierKey, MarketplaceTierDefinition> = {
  FREE: {
    key: "FREE",
    label: "Free",
    featuredCreditsPerMonth: 0,
    analyticsFull: false,
    brokerTools: false,
    priorityVisibilityBoost: 0,
    monthlyCents: 0,
    listingCap: 1,
  },
  PRO: {
    key: "PRO",
    label: "Pro",
    featuredCreditsPerMonth: 1,
    analyticsFull: true,
    brokerTools: true,
    priorityVisibilityBoost: 0.04,
    monthlyCents: 4_900,
    listingCap: 5,
  },
  PLATINUM: {
    key: "PLATINUM",
    label: "Platinum",
    featuredCreditsPerMonth: 3,
    analyticsFull: true,
    brokerTools: true,
    priorityVisibilityBoost: 0.08,
    monthlyCents: 12_900,
    listingCap: 25,
  },
} as const;

export function getMarketplaceTierDefinition(key: MarketplaceSubscriptionTierKey): MarketplaceTierDefinition {
  return MARKETPLACE_SUBSCRIPTION_TIERS[key];
}
