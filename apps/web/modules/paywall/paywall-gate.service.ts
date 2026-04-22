/**
 * Central feature gates — compose workspace entitlements + broker SaaS tier + quotas.
 */

import type { PlanCode } from "@/modules/billing/getPlanEntitlements";
import {
  getSubscriptionEntitlements,
  getWorkspaceEntitlements,
  getPlanEntitlements,
  normalizePlanCode,
} from "@/modules/billing/getPlanEntitlements";
import { prisma } from "@/lib/db";

import type { PaywallDecision, PaywallFeature } from "./paywall.types";
import { paywallPrompt } from "./upgrade-prompts";

const ACTIVE_BROKER = ["active", "trialing"];

function tierRank(plan: PlanCode): number {
  switch (plan) {
    case "enterprise":
      return 4;
    case "platinum":
      return 3;
    case "pro":
      return 2;
    default:
      return 1;
  }
}

function needsMinPlan(feature: PaywallFeature): PlanCode | null {
  switch (feature) {
    case "trustgraph_premium":
    case "deal_analyzer_advanced":
      return "pro";
    case "workspace_copilot":
      return "pro";
    case "premium_listing_placement":
      return "pro";
    case "broker_lead_priority":
      return "pro";
    case "investor_deep_analytics":
      return "pro";
    case "family_premium_bundle":
      return "pro";
    case "bnhub_host_analytics_bundle":
      return "pro";
    default:
      return "pro";
  }
}

function defaultUpgradeHref(feature: PaywallFeature): string {
  switch (feature) {
    case "broker_lead_priority":
      return "/broker/pricing";
    case "investor_deep_analytics":
      return "/investor/(portal)"; // shell resolves
    case "family_premium_bundle":
      return "/dashboard/buyer";
    default:
      return "/signup";
  }
}

/**
 * Evaluate whether `userId` may use `feature`. Uses DB reads — call from server actions / route handlers.
 */
export async function evaluatePaywall(userId: string, feature: PaywallFeature): Promise<PaywallDecision> {
  const minPlan = needsMinPlan(feature);
  const prompt = paywallPrompt(feature);
  const fail = (
    reason: PaywallDecision extends { allowed: false } ? PaywallDecision["reason"] : never,
    extra?: Partial<Extract<PaywallDecision, { allowed: false }>>,
  ): PaywallDecision => ({
    allowed: false,
    reason,
    upgradeHref: extra?.upgradeHref ?? defaultUpgradeHref(feature),
    message: extra?.message ?? prompt.body,
    minimumPlan: extra?.minimumPlan ?? minPlan ?? undefined,
    ...extra,
  });

  const [ws, subEnt, brokerSub] = await Promise.all([
    getWorkspaceEntitlements(userId),
    getSubscriptionEntitlements({ userId }),
    prisma.brokerLecipmSubscription.findUnique({
      where: { userId },
      select: { planSlug: true, status: true },
    }),
  ]);

  const planFromWorkspace = normalizePlanCode(ws.planTier);
  const planFromStripe = normalizePlanCode(subEnt.plan);
  const pick = (a: PlanCode, b: PlanCode): PlanCode =>
    tierRank(a) >= tierRank(b) ? a : b;
  let effectivePlan = pick(planFromWorkspace, planFromStripe);

  if (brokerSub && ACTIVE_BROKER.includes(brokerSub.status)) {
    const b = normalizePlanCode(brokerSub.planSlug);
    if (tierRank(b) > tierRank(effectivePlan)) effectivePlan = b;
  }

  if (feature === "broker_lead_priority") {
    if (!brokerSub || !ACTIVE_BROKER.includes(brokerSub.status)) {
      return fail("subscription_inactive", {
        message: prompt.body,
        minimumPlan: "pro",
      });
    }
  }

  const ent = getPlanEntitlements(effectivePlan);
  const meets =
    minPlan === null ||
    tierRank(effectivePlan) >= tierRank(minPlan);

  if (!meets) {
    return fail("plan_too_low", {
      minimumPlan: minPlan ?? "pro",
      message: prompt.body,
      upgradeHref: defaultUpgradeHref(feature),
    });
  }

  if (feature === "trustgraph_premium" && !ent.trustgraphPremium) {
    return fail("plan_too_low", { minimumPlan: "pro" });
  }
  if (feature === "deal_analyzer_advanced" && !ent.dealAnalyzerAdvanced) {
    return fail("plan_too_low", { minimumPlan: "pro" });
  }
  if (feature === "workspace_copilot" && !subEnt.features.copilot) {
    return fail("subscription_inactive");
  }

  if (feature === "premium_listing_placement") {
    const used = await prisma.listing.count({
      where: {
        brokerAccesses: { some: { brokerId: userId } },
      },
    });
    const limit = subEnt.limits.maxListings;
    if (used >= limit) {
      return fail("quota_exceeded", {
        usage: { used, limit },
        message: "Listing limit reached for your plan.",
      });
    }
  }

  return { allowed: true };
}
