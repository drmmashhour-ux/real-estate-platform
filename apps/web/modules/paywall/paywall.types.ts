import type { PlanCode } from "@/modules/billing/getPlanEntitlements";

/** Product surfaces gated for upgrade / quota prompts. */
export type PaywallFeature =
  | "trustgraph_premium"
  | "deal_analyzer_advanced"
  | "workspace_copilot"
  | "premium_listing_placement"
  | "broker_lead_priority"
  | "investor_deep_analytics"
  | "family_premium_bundle"
  | "bnhub_host_analytics_bundle";

export type PaywallDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: "plan_too_low" | "quota_exceeded" | "subscription_inactive";
      minimumPlan?: PlanCode;
      /** Feature-specific usage vs cap when applicable */
      usage?: { used: number; limit: number };
      upgradeHref: string;
      message: string;
    };
