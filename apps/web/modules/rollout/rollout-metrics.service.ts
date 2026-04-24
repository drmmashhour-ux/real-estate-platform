import { prisma } from "@/lib/db";

export type RolloutMetricsBundle = {
  conversionRate: number;
  revenuePerUser: number;
  engagementScore: number;
  dealSuccessRate: number;
};

/**
 * Platform-level proxy metrics for rollout evaluation (no fabricated cohort splits in v1).
 */
export async function collectRolloutMetricsBundle(): Promise<RolloutMetricsBundle> {
  const thirty = new Date();
  thirty.setDate(thirty.getDate() - 30);

  const [totalLeads, closedLeads, dealsActive, advancedDeals, matchEvents, userCount, revenueRows] =
    await Promise.all([
      prisma.seniorLead.count({ where: { createdAt: { gte: thirty } } }),
      prisma.seniorLead.count({
        where: { createdAt: { gte: thirty }, status: "CLOSED" },
      }),
      prisma.amfCapitalDeal.count({
        where: { status: { notIn: ["CLOSED", "PAUSED", "AVOID"] } },
      }),
      prisma.amfCapitalDeal.count({
        where: { status: { in: ["DILIGENCE", "COMMITMENT"] } },
      }),
      prisma.matchingEvent.count().catch(() => 0),
      prisma.user.count().catch(() => 1),
      prisma.revenueSnapshot.findMany({
        orderBy: { snapshotDate: "desc" },
        take: 2,
        select: { mrr: true },
      }),
    ]);

  const conversionRate = totalLeads === 0 ? 0 : closedLeads / totalLeads;
  const dealSuccessRate = dealsActive > 0 ? advancedDeals / dealsActive : 0;

  let revenuePerUser = 0;
  if (revenueRows.length >= 2 && revenueRows[0]?.mrr != null && revenueRows[1]?.mrr != null) {
    const a = Number(revenueRows[0].mrr);
    const b = Number(revenueRows[1].mrr);
    if (b > 1e-9) revenuePerUser = (a - b) / b;
  }

  const engagementScore = Math.min(1, matchEvents / Math.max(1, userCount) / 10);

  return {
    conversionRate,
    revenuePerUser,
    engagementScore,
    dealSuccessRate,
  };
}

export async function persistRolloutMetricSnapshot(executionId: string): Promise<void> {
  const bundle = await collectRolloutMetricsBundle();
  await prisma.rolloutMetricSnapshot.create({
    data: {
      executionId,
      metricsJson: bundle,
    },
  });
}
