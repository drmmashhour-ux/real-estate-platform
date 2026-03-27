/**
 * Entitlements – link paid plans to feature access.
 */

import { prisma } from "@/lib/db";

/** Map feature names to plan slugs that grant access. Empty = free for all. */
const FEATURE_PLANS: Record<string, string | null> = {
  advanced_crm: "broker-crm-pro",
  advanced_analytics: "owner-analytics-pro",
  premium_pricing_ai: "host-pro",
  premium_market_intelligence: "investor-intelligence-pro",
  premium_valuation_reports: "owner-analytics-pro",
  premium_investment_scoring: "investor-intelligence-pro",
  ai_insights_premium: "ai-insights-premium",
};

export async function checkEntitlement(
  userId: string,
  featureName: string
): Promise<{ accessStatus: "granted" | "denied" | "trial"; reason?: string; planSlug?: string }> {
  const requiredPlanSlug = FEATURE_PLANS[featureName] ?? null;
  if (requiredPlanSlug === null) {
    return { accessStatus: "granted", reason: "Feature is free" };
  }

  const sub = await prisma.planSubscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "TRIALING"] },
      plan: { slug: requiredPlanSlug, active: true },
      currentPeriodEnd: { gte: new Date() },
    },
    include: { plan: true },
    orderBy: { currentPeriodEnd: "desc" },
  });

  if (!sub) {
    return {
      accessStatus: "denied",
      reason: `Requires plan: ${requiredPlanSlug}`,
      planSlug: requiredPlanSlug,
    };
  }
  return {
    accessStatus: sub.status === "TRIALING" ? "trial" : "granted",
    reason: sub.status === "TRIALING" ? "Trial period" : undefined,
    planSlug: sub.plan.slug,
  };
}

export async function getEntitlementsForUser(userId: string) {
  const features = Object.keys(FEATURE_PLANS);
  const results = await Promise.all(
    features.map(async (featureName) => {
      const result = await checkEntitlement(userId, featureName);
      return {
        featureName,
        requiredPlanSlug: FEATURE_PLANS[featureName],
        accessStatus: result.accessStatus,
        reason: result.reason,
      };
    })
  );
  return results;
}
