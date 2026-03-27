import type { Prisma } from "@prisma/client";
import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type PlanCode = "free" | "pro" | "platinum" | "enterprise";

export type PlanEntitlements = {
  trustgraphPremium: boolean;
  dealAnalyzerAdvanced: boolean;
  enterpriseDashboards: boolean;
  partnerApiAccess: boolean;
};

/** Maps Stripe / product plan codes to a canonical tier. */
export function normalizePlanCode(raw: string): PlanCode {
  const c = (raw || "free").toLowerCase();
  if (c.includes("enterprise")) return "enterprise";
  if (c.includes("platinum")) return "platinum";
  if (c.includes("pro")) return "pro";
  return "free";
}

export function getPlanEntitlements(planCode: string): PlanEntitlements {
  const plan = normalizePlanCode(planCode);

  switch (plan) {
    case "enterprise":
      return {
        trustgraphPremium: true,
        dealAnalyzerAdvanced: true,
        enterpriseDashboards: true,
        partnerApiAccess: true,
      };
    case "platinum":
      return {
        trustgraphPremium: true,
        dealAnalyzerAdvanced: true,
        enterpriseDashboards: true,
        partnerApiAccess: false,
      };
    case "pro":
      return {
        trustgraphPremium: true,
        dealAnalyzerAdvanced: true,
        enterpriseDashboards: false,
        partnerApiAccess: false,
      };
    default:
      return {
        trustgraphPremium: false,
        dealAnalyzerAdvanced: false,
        enterpriseDashboards: false,
        partnerApiAccess: false,
      };
  }
}

export type WorkspacePlanTier = PlanCode;

export type WorkspaceEntitlements = {
  planTier: WorkspacePlanTier;
  /** True when Stripe mirror has an active or trialing subscription row for this user. */
  hasActivePaidWorkspace: boolean;
} & PlanEntitlements;

const ACTIVE: SubscriptionStatus[] = [SubscriptionStatus.active, SubscriptionStatus.trialing];

/**
 * Feature gates for commercial / growth surfaces. Core safety (trust, deal analysis) stays available on free tier;
 * these flags control premium product surfaces only.
 */
export async function getWorkspaceEntitlements(userId: string): Promise<WorkspaceEntitlements> {
  const row = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ACTIVE },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!row) {
    return {
      planTier: "free",
      hasActivePaidWorkspace: false,
      ...getPlanEntitlements("free"),
    };
  }

  const planTier = normalizePlanCode(row.planCode);
  const base = getPlanEntitlements(planTier);

  return {
    planTier,
    hasActivePaidWorkspace: true,
    ...base,
  };
}

/** Monetization / gating shape (Stripe workspace `subscriptions` row — no `profileId`; use `userId`). */
export type SubscriptionEntitlements = {
  plan: string;
  features: {
    copilot: boolean;
    advancedAnalytics: boolean;
    premiumPlacement: boolean;
    maxListings: number;
  };
  limits: {
    maxListings: number;
  };
};

const FREE_ENTITLEMENTS: SubscriptionEntitlements = {
  plan: "free",
  features: {
    copilot: false,
    advancedAnalytics: false,
    premiumPlacement: false,
    maxListings: 1,
  },
  limits: { maxListings: 1 },
};

function maxListingsForTier(tier: PlanCode): number {
  switch (tier) {
    case "enterprise":
      return 5000;
    case "platinum":
      return 200;
    case "pro":
      return 50;
    default:
      return 1;
  }
}

/**
 * Resolve plan + feature flags from the Stripe-mirrored `subscriptions` table (user and/or workspace).
 * Paid **pro+** tiers unlock Copilot for this gate; adjust mapping in one place if product changes.
 */
export async function getSubscriptionEntitlements(input: {
  userId?: string;
  workspaceId?: string;
}): Promise<SubscriptionEntitlements> {
  if (!input.userId && !input.workspaceId) {
    return FREE_ENTITLEMENTS;
  }

  const or: Prisma.SubscriptionWhereInput[] = [];
  if (input.userId) or.push({ userId: input.userId });
  if (input.workspaceId) or.push({ workspaceId: input.workspaceId });

  const subscription = await prisma.subscription.findFirst({
    where: {
      status: { in: ACTIVE },
      OR: or,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!subscription) {
    return FREE_ENTITLEMENTS;
  }

  const tier = normalizePlanCode(subscription.planCode);
  const pe = getPlanEntitlements(tier);
  const maxListings = maxListingsForTier(tier);

  const copilotEnabled = tier !== "free" && ACTIVE.includes(subscription.status);

  return {
    plan: tier,
    features: {
      copilot: copilotEnabled,
      advancedAnalytics: copilotEnabled && pe.dealAnalyzerAdvanced,
      premiumPlacement: copilotEnabled && pe.trustgraphPremium,
      maxListings,
    },
    limits: { maxListings },
  };
}
