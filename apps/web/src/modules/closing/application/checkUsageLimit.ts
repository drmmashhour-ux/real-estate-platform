import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { checkGrowthPaywall } from "@/src/modules/growth-funnel/application/checkGrowthPaywall";
import { hasUnlimitedGrowthUsage, maxFreeAiDrafts, maxFreeSimulatorRuns } from "@/src/modules/growth-funnel/domain/usageLimits";
import { getOrCreateUsageCounter } from "@/src/modules/growth-funnel/infrastructure/growthFunnelRepository";
import type { UsageFeature } from "@/src/modules/closing/domain/usageFeature";

export type UsageLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  limitReached: boolean;
  feature: UsageFeature;
};

function isProOrBasic(plan: string): boolean {
  return hasUnlimitedGrowthUsage(plan);
}

export async function checkUsageLimit(userId: string, feature: UsageFeature): Promise<UsageLimitResult> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true },
  });
  if (!u) {
    return { allowed: false, remaining: 0, limit: 0, limitReached: true, feature };
  }

  if (u.role === "ADMIN") {
    return { allowed: true, remaining: 999999, limit: 999999, limitReached: false, feature };
  }

  if (feature === "negotiation" || feature === "advanced") {
    const allowed = isProOrBasic(u.plan);
    return {
      allowed,
      remaining: allowed ? 999999 : 0,
      limit: allowed ? 999999 : 0,
      limitReached: !allowed,
      feature,
    };
  }

  const kind = feature === "simulator" ? "simulator" : "ai_draft";
  const gate = await checkGrowthPaywall({ userId, plan: u.plan, role: u.role as PlatformRole, kind });
  return {
    allowed: gate.allowed,
    remaining: gate.remaining,
    limit: gate.limit,
    limitReached: !gate.allowed,
    feature,
  };
}

/** Snapshot for UI — includes raw counts from user usage row. */
export async function getUsageSnapshot(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true },
  });
  if (!u) return null;
  const counter = await getOrCreateUsageCounter(userId);
  const sim = await checkGrowthPaywall({ userId, plan: u.plan, role: u.role as PlatformRole, kind: "simulator" });
  const draft = await checkGrowthPaywall({ userId, plan: u.plan, role: u.role as PlatformRole, kind: "ai_draft" });
  const advancedLocked = !isProOrBasic(u.plan) && u.role !== "ADMIN";

  return {
    plan: u.plan,
    simulations: {
      used: counter.simulatorRuns,
      limit: maxFreeSimulatorRuns(),
      remaining: sim.remaining,
      allowed: sim.allowed,
    },
    drafts: {
      used: counter.aiDrafts,
      limit: maxFreeAiDrafts(),
      remaining: draft.remaining,
      allowed: draft.allowed,
    },
    advancedLocked,
    resetPeriod: counter.resetPeriod,
    usagePeriodKey: counter.usagePeriodKey,
  };
}
