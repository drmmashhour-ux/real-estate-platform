import { subDays } from "date-fns";

import { prisma } from "@/lib/db";

export async function loadDisputePredictionDashboardPayload() {
  const since30 = subDays(new Date(), 30);

  const [
    highRisk,
    categoryMix,
    recentSnapshots,
    patterns,
    adjustments,
    disputeCount30,
    snapshotCount30,
  ] = await Promise.all([
    prisma.lecipmDisputePredictionSnapshot.findMany({
      where: {
        riskBand: { in: ["HIGH", "CRITICAL"] },
        createdAt: { gte: since30 },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.lecipmDisputePredictionSnapshot.groupBy({
      by: ["predictedCategory"],
      where: { createdAt: { gte: since30 } },
      _count: { _all: true },
    }),
    prisma.lecipmDisputePredictionSnapshot.findMany({
      where: { createdAt: { gte: since30 } },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        entityType: true,
        entityId: true,
        disputeRiskScore: true,
        riskBand: true,
        predictedCategory: true,
        createdAt: true,
        preventionActionsJson: true,
        topSignalsJson: true,
      },
    }),
    prisma.lecipmDisputePredictionPattern.findMany({
      orderBy: { confidence: "desc" },
      take: 25,
    }),
    prisma.lecipmSystemBehaviorAdjustment.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.lecipmDisputeCase.count({
      where: { createdAt: { gte: since30 } },
    }),
    prisma.lecipmDisputePredictionSnapshot.count({
      where: { createdAt: { gte: since30 } },
    }),
  ]);

  const preventedProxy = recentSnapshots.filter((s) => s.preventionActionsJson != null).length;

  const accuracyProxy = {
    note:
      "Link snapshots to later disputes via entity keys — full precision/recall pipeline requires warehouse join (planned).",
    snapshotsLast30d: snapshotCount30,
    disputesOpenedLast30d: disputeCount30,
  };

  const topFriction = aggregateTopSignalsFromSnapshots(recentSnapshots);

  return {
    generatedAt: new Date().toISOString(),
    highRiskCases: highRisk,
    predictedCategoryMix: categoryMix.map((c) => ({
      category: c.predictedCategory,
      count: c._count._all,
    })),
    preventiveActionsTriggeredApprox: preventedProxy,
    learnedPatterns: patterns,
    preventedVsActualDisputes: accuracyProxy,
    topFrictionSources: topFriction,
    ceoAdjustments: adjustments,
  };
}

function aggregateTopSignalsFromSnapshots(
  rows: Array<{ id: string; topSignalsJson: unknown }>
): Array<{ signalId: string; count: number }> {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const sigs = r.topSignalsJson as Array<{ id: string }> | null;
    if (!Array.isArray(sigs)) continue;
    for (const s of sigs) {
      counts.set(s.id, (counts.get(s.id) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([signalId, count]) => ({ signalId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

export async function loadDisputePredictionObservabilityForCommandCenter() {
  const since30 = subDays(new Date(), 30);
  const [trendBuckets, highRiskZones, proposals] = await Promise.all([
    prisma.lecipmDisputePredictionSnapshot.groupBy({
      by: ["riskBand"],
      where: { createdAt: { gte: since30 } },
      _count: { _all: true },
    }),
    prisma.lecipmDisputePredictionSnapshot.findMany({
      where: {
        riskBand: { in: ["HIGH", "CRITICAL"] },
        createdAt: { gte: since30 },
      },
      take: 15,
      orderBy: { disputeRiskScore: "desc" },
      select: {
        entityType: true,
        entityId: true,
        disputeRiskScore: true,
        predictedCategory: true,
        createdAt: true,
      },
    }),
    prisma.lecipmSystemBehaviorAdjustment.findMany({
      where: { status: "PROPOSED" },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return {
    riskBandTrend30d: trendBuckets.map((t) => ({ band: t.riskBand, count: t._count._all })),
    highRiskZones,
    ceoRiskAdjustmentsPending: proposals,
    note: "Dispute prediction is advisory — pairs with prevention logs and dispute room outcomes for measurement.",
  };
}
