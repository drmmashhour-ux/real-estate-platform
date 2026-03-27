/**
 * AI Model Monitoring – accuracy, fraud results, pricing success for admin dashboards.
 */
import { prisma } from "@/lib/db";

export type FraudDecisionCounts = { decision: string; count: number }[];
export type ModelVersionMetrics = { modelKey: string; version: number; metrics: Record<string, number> | null }[];

/** Fraud detection: decision counts (ALLOW, FLAG, BLOCK) for the fraud model. */
export async function getFraudDecisionCounts(): Promise<FraudDecisionCounts> {
  const logs = await prisma.aiDecisionLog.groupBy({
    by: ["decision"],
    where: { model: { key: "fraud" } },
    _count: { id: true },
  });
  return logs.map((l) => ({ decision: l.decision, count: l._count.id }));
}

/** Model version metrics (accuracy, precision, recall, etc.) from ModelVersion.metrics. */
export async function getModelVersionMetrics(): Promise<ModelVersionMetrics> {
  const versions = await prisma.modelVersion.findMany({
    where: { deprecatedAt: null },
    include: { model: { select: { key: true } } },
    orderBy: [{ modelId: "asc" }, { version: "desc" }],
    take: 20,
  });
  return versions.map((v) => ({
    modelKey: v.model.key,
    version: v.version,
    metrics: v.metrics as Record<string, number> | null,
  }));
}

/** Pricing recommendation success: count of recommendations in last 30 days (adoption tracking can be added later). */
export async function getPricingRecommendationStats(): Promise<{
  total: number;
  last30Days: number;
  byDemandLevel: { demandLevel: string; count: number }[];
}> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [total, last30, byDemand] = await Promise.all([
    prisma.aiPricingRecommendation.count(),
    prisma.aiPricingRecommendation.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.aiPricingRecommendation.groupBy({
      by: ["demandLevel"],
      _count: { id: true },
    }),
  ]);
  return {
    total,
    last30Days: last30,
    byDemandLevel: byDemand.map((d) => ({ demandLevel: d.demandLevel, count: d._count.id })),
  };
}
