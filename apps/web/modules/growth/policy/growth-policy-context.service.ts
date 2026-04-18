import { prisma } from "@/lib/db";
import { buildGrowthPolicyEnforcementSnapshot } from "@/modules/growth/growth-policy-enforcement.service";
import { getRevenueMonitoringSnapshot } from "@/modules/revenue/revenue-monitoring.service";
import { buildRevenueDashboardSummary } from "@/modules/revenue/revenue-dashboard.service";

import type { EvaluateGrowthPoliciesContext } from "./growth-policy.types";

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addUtcDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

async function loadAdsAggregatesFromLatestLoop(): Promise<
  EvaluateGrowthPoliciesContext["adsMetrics"] | null
> {
  const run = await prisma.adsAutomationLoopRun.findFirst({
    orderBy: { createdAt: "desc" },
    include: { campaignResults: true },
  });
  if (!run?.campaignResults?.length) {
    return null;
  }
  let impressions = 0;
  let clicks = 0;
  let leads = 0;
  for (const c of run.campaignResults) {
    impressions += c.impressions ?? 0;
    clicks += c.clicks ?? 0;
    leads += c.leads ?? 0;
  }
  const conversionRate = clicks > 0 ? leads / clicks : undefined;
  return {
    impressions,
    clicks,
    leads,
    conversionRate,
  };
}

async function loadContentMetricsWindow(): Promise<NonNullable<EvaluateGrowthPoliciesContext["contentMetrics"]>> {
  const now = new Date();
  const from = addUtcDays(startOfUtcDay(now), -13);
  const [generatedCount, agg] = await Promise.all([
    prisma.contentGenerated.count({ where: { createdAt: { gte: from } } }).catch(() => 0),
    prisma.contentGenerated
      .aggregate({
        where: { createdAt: { gte: from } },
        _sum: { metricsViews: true, metricsClicks: true },
      })
      .catch(() => ({ _sum: { metricsViews: null as number | null, metricsClicks: null as number | null } })),
  ]);
  const engagementCount =
    (agg._sum.metricsViews ?? 0) + (agg._sum.metricsClicks ?? 0);
  return {
    generatedCount,
    engagementCount,
  };
}

/**
 * Assembles evaluation context from existing read-only platform signals — no writes.
 */
export async function buildGrowthPolicyEvaluationContextFromPlatform(): Promise<EvaluateGrowthPoliciesContext> {
  const [rev, enf, adsMetrics, contentMetrics] = await Promise.all([
    buildRevenueDashboardSummary().catch(() => null),
    buildGrowthPolicyEnforcementSnapshot().catch(() => null),
    loadAdsAggregatesFromLatestLoop().catch(() => null),
    loadContentMetricsWindow().catch(() => null),
  ]);
  const mon = getRevenueMonitoringSnapshot();

  let governanceDecision: EvaluateGrowthPoliciesContext["governanceDecision"] = null;
  if (enf) {
    const freeze = enf.frozenTargets.length > 0;
    const review = enf.approvalRequiredTargets.length > 0;
    let status: string | undefined;
    if (freeze) status = "freeze_recommended";
    else if (review) status = "human_review_required";
    if (status) {
      governanceDecision = {
        status,
        notes: enf.notes?.length ? [...enf.notes] : undefined,
      };
    }
  }

  const messagingMetrics: NonNullable<EvaluateGrowthPoliciesContext["messagingMetrics"]> = {
    queued: mon.unlockAttempts,
    responded: mon.unlockSuccess,
    responseRate:
      mon.unlockAttempts > 0 ? mon.unlockSuccess / Math.max(1, mon.unlockAttempts) : undefined,
  };

  const ctx: EvaluateGrowthPoliciesContext = {
    governanceDecision,
    revenueSummary: rev
      ? {
          revenueToday: rev.revenueToday,
          revenueWeek: rev.revenueWeek,
          leadsViewed: rev.leadsViewed,
          leadsUnlocked: rev.leadsUnlocked,
          leadUnlockRate: rev.leadUnlockRate,
          bookingStarts: rev.bookingStarts,
          bookingCompleted: rev.bookingCompleted,
        }
      : null,
    leadMetrics: {
      viewed: rev?.leadsViewed,
      unlocked: rev?.leadsUnlocked,
      followUpQueue: mon.unlockAttempts,
      responded: mon.unlockSuccess,
    },
    messagingMetrics,
    brokerMetrics: rev
      ? {
          activeBrokers: rev.activeBrokers,
          avgCloseRate: rev.leadUnlockRate,
        }
      : undefined,
    adsMetrics: adsMetrics ?? undefined,
    pricingMetrics: {
      unstableSignals: false,
    },
    contentMetrics: contentMetrics && (contentMetrics.generatedCount ?? 0) > 0 ? contentMetrics : undefined,
  };

  return ctx;
}
