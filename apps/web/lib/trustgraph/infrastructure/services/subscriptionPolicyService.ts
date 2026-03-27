import { prisma } from "@/lib/db";
import type { PlanFeatureFlags } from "@/lib/trustgraph/domain/billing";
import { isTrustGraphBillingEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";

export async function getWorkspaceIdForListingEntity(listingId: string): Promise<string | null> {
  const link = await prisma.trustgraphComplianceWorkspaceEntityLink.findFirst({
    where: { entityType: "LISTING", entityId: listingId },
    select: { workspaceId: true },
  });
  return link?.workspaceId ?? null;
}

function parseFeatures(raw: unknown): PlanFeatureFlags {
  if (!raw || typeof raw !== "object") return {};
  return raw as PlanFeatureFlags;
}

export async function getActiveSubscriptionForWorkspace(workspaceId: string) {
  if (!isTrustGraphEnabled() || !isTrustGraphBillingEnabled()) return null;
  return prisma.trustgraphSubscription.findFirst({
    where: {
      workspaceId,
      status: { in: ["active", "trial"] },
    },
    include: { plan: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function isPlanFeatureEnabled(
  workspaceId: string | null,
  feature: keyof PlanFeatureFlags
): Promise<boolean> {
  if (!workspaceId) return true;
  if (!isTrustGraphEnabled() || !isTrustGraphBillingEnabled()) return true;

  const sub = await getActiveSubscriptionForWorkspace(workspaceId);
  if (!sub) return false;
  const flags = parseFeatures(sub.plan.features);
  return flags[feature] === true;
}

/** Monetization gates only — never used for core safety verification paths. */
export async function subscriptionAllowsPremiumPlacement(workspaceId: string | null): Promise<boolean> {
  return isPlanFeatureEnabled(workspaceId, "premiumPlacement");
}

export async function subscriptionAllowsSlaFeatures(workspaceId: string | null): Promise<boolean> {
  return isPlanFeatureEnabled(workspaceId, "slaFeatures");
}

export async function subscriptionAllowsEnterpriseDashboards(workspaceId: string | null): Promise<boolean> {
  return isPlanFeatureEnabled(workspaceId, "enterpriseDashboards");
}

export async function subscriptionAllowsAdvancedAnalytics(workspaceId: string | null): Promise<boolean> {
  return isPlanFeatureEnabled(workspaceId, "advancedAnalytics");
}
