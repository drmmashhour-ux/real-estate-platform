/** DIY seller monetization tiers — stored on `User.sellerPlan`. */
export const SELLER_PLANS = ["basic", "assisted", "premium"] as const;
export type SellerPlanId = (typeof SELLER_PLANS)[number];

const SET = new Set<string>(SELLER_PLANS);

export function isSellerPlanId(v: string | null | undefined): v is SellerPlanId {
  return v != null && SET.has(v);
}

export type SellerPlanFeatures = {
  diyOnly: boolean;
  aiGuidance: boolean;
  platformBrokerRequest: boolean;
  prioritySupport: boolean;
};

/** Feature flags by plan — use in seller UI and server guards. */
export function getSellerPlanFeatures(plan: string | null | undefined): SellerPlanFeatures {
  const p = isSellerPlanId(plan) ? plan : "basic";
  switch (p) {
    case "basic":
      return { diyOnly: true, aiGuidance: false, platformBrokerRequest: false, prioritySupport: false };
    case "assisted":
      return { diyOnly: true, aiGuidance: true, platformBrokerRequest: true, prioritySupport: true };
    case "premium":
      return { diyOnly: false, aiGuidance: true, platformBrokerRequest: true, prioritySupport: true };
    default:
      return getSellerPlanFeatures("basic");
  }
}
