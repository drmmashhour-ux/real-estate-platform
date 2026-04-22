/** Short CTA strings for `<UpgradeBanner />` / toast — keep neutral and product-accurate. */

import type { PaywallFeature } from "./paywall.types";

const COPY: Record<
  PaywallFeature,
  { title: string; body: string; primaryCta: string }
> = {
  trustgraph_premium: {
    title: "TrustGraph premium",
    body: "Upgrade your workspace plan to unlock premium trust signals and ranking.",
    primaryCta: "View plans",
  },
  deal_analyzer_advanced: {
    title: "Deal Analyzer Pro",
    body: "Advanced scenarios and sensitivity analysis are included on Pro and Platinum.",
    primaryCta: "Upgrade workspace",
  },
  workspace_copilot: {
    title: "Copilot",
    body: "Assistant features are enabled on paid workspace tiers.",
    primaryCta: "Subscribe",
  },
  premium_listing_placement: {
    title: "Premium placement",
    body: "Boost visibility with a featured placement add-on.",
    primaryCta: "Add placement",
  },
  broker_lead_priority: {
    title: "Broker priority",
    body: "Subscribe to Broker Pro or Platinum for lead priority and marketplace limits.",
    primaryCta: "Broker plans",
  },
  investor_deep_analytics: {
    title: "Investor analytics",
    body: "Premium investor dashboards require Investor Premium.",
    primaryCta: "Upgrade",
  },
  family_premium_bundle: {
    title: "Family Premium",
    body: "Unlock camera access, alerts, and extended history for families.",
    primaryCta: "Family Premium",
  },
  bnhub_host_analytics_bundle: {
    title: "Host analytics",
    body: "Advanced host analytics may require an active BNHub subscription bundle.",
    primaryCta: "Learn more",
  },
};

export function paywallPrompt(feature: PaywallFeature): (typeof COPY)[PaywallFeature] {
  return COPY[feature];
}
