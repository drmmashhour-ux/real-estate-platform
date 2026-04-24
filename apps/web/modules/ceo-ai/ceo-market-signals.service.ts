/**
 * Market signals for AI CEO — isolated from orchestration to avoid import cycles (e.g. outcome tracker).
 */
import { prisma } from "@/lib/db";
import { PlatformRole } from "@prisma/client";
import {
  computeDemandQualitySignals,
  normalizeDemandIndexMetrics,
} from "@/modules/monetization/dynamic-market-pricing.service";

export async function gatherMarketSignals() {
  const d30 = new Date();
  d30.setDate(d30.getDate() - 30);
  const d60 = new Date();
  d60.setDate(d60.getDate() - 60);
  const d90 = new Date();
  d90.setDate(d90.getDate() - 90);
  const inactiveCutoff = new Date();
  inactiveCutoff.setDate(inactiveCutoff.getDate() - 90);

  const [
    leadsLast30d,
    leadsPrev30d,
    closed30,
    operatorsWithResidences,
    brokerAccountsApprox,
    operatorUsersRecent,
    brokersJoinedLast90d,
    inactiveBrokers,
    residencesWithoutRecentLead,
    sig,
    seoBlogCount,
    avgLeadScore,
    revenueRows,
    gtmRecent,
    dealsActive,
    esgRecent,
  ] = await Promise.all([
    prisma.seniorLead.count({ where: { createdAt: { gte: d30 } } }),
    prisma.seniorLead.count({ where: { createdAt: { gte: d60, lt: d30 } } }),
    prisma.seniorLead.count({ where: { createdAt: { gte: d30 }, status: "CLOSED" } }),
    prisma.seniorResidence
      .groupBy({
        by: ["operatorId"],
        where: { operatorId: { not: null } },
      })
      .then((r) => r.length),
    prisma.user.count({ where: { role: PlatformRole.BROKER } }),
    prisma.user.count({
      where: {
        seniorLivingResidencesOperated: { some: {} },
        createdAt: { gte: d90 },
      },
    }),
    prisma.user.count({
      where: { role: PlatformRole.BROKER, createdAt: { gte: d90 } },
    }),
    prisma.user.count({
      where: {
        role: PlatformRole.BROKER,
        updatedAt: { lt: inactiveCutoff },
      },
    }),
    prisma.seniorResidence.count({
      where: {
        leads: { none: { createdAt: { gte: d30 } } },
        operatorId: { not: null },
      },
    }),
    computeDemandQualitySignals(),
    prisma.seoBlogPost.count().catch(() => 0),
    prisma.leadScore.aggregate({ _avg: { score: true } }),
    prisma.revenueSnapshot.findMany({
      orderBy: { snapshotDate: "desc" },
      take: 2,
      select: { mrr: true, snapshotDate: true },
    }),
    prisma.seniorLivingGtmExecutionEvent.count({
      where: { occurredAt: { gte: d30 } },
    }),
    prisma.amfCapitalDeal.count({
      where: { status: { notIn: ["CLOSED", "PAUSED", "AVOID"] } },
    }),
    prisma.esgEvent.count({
      where: { createdAt: { gte: d30 } },
    }),
  ]);

  const activeDealsCount = dealsActive;
  const advancedDeals = await prisma.amfCapitalDeal.count({
    where: { status: { in: ["DILIGENCE", "COMMITMENT"] } },
  });
  const dealPipelineHealth = activeDealsCount > 0 ? advancedDeals / activeDealsCount : 0.5;

  const esgActivityLevel = Math.min(1.0, esgRecent / 20);

  const seniorConversionRate30d = leadsLast30d === 0 ? 0 : closed30 / leadsLast30d;

  const demandIndex = normalizeDemandIndexMetrics({
    leadsLast30d: sig.leadsLast30d,
    operatorCount: sig.operatorCount,
    residencesInMarket: sig.residencesInMarket,
    activeUsersProxy: sig.activeUsersProxy,
  });

  let revenueTrend30dProxy = 0;
  if (revenueRows.length >= 2 && revenueRows[0]?.mrr != null && revenueRows[1]?.mrr != null) {
    const a = Number(revenueRows[0].mrr);
    const b = Number(revenueRows[1].mrr);
    if (b > 1e-9) revenueTrend30dProxy = (a - b) / b;
  }

  const outreachReplyRateProxy =
    gtmRecent > 0 ? Math.min(0.35, 0.12 + Math.min(0.2, gtmRecent / 400)) : null;

  return {
    leadsLast30d,
    leadsPrev30d,
    seniorConversionRate30d,
    operatorsWithResidences,
    brokerAccountsApprox,
    operatorOnboardedLast90d: operatorUsersRecent,
    brokersJoinedLast90d,
    churnInactiveBrokersApprox: inactiveBrokers,
    inactiveOperatorsApprox: Math.min(residencesWithoutRecentLead, 500),
    demandIndex,
    outreachReplyRateProxy,
    seoPagesIndexedApprox: seoBlogCount,
    emailEngagementScore: null,
    avgLeadQualityScore: avgLeadScore._avg.score ?? null,
    revenueTrend30dProxy,
    activeDealsCount,
    dealPipelineHealth,
    esgActivityLevel,
  };
}
