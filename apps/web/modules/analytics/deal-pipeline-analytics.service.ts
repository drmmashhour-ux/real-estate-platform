import { prisma } from "@/lib/db";

/** Aggregates for investor dashboards — no PII in returned shape. */
export async function getDealPipelineMetrics(workspaceId?: string | null) {
  const where = workspaceId ? { workspaceId } : {};
  const deals = await prisma.deal.findMany({
    where,
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      lecipmExecutionPipelineState: true,
      status: true,
    },
  });

  const total = deals.length;
  const closed = deals.filter((d) => d.lecipmExecutionPipelineState === "closed" || d.status === "closed").length;
  const byStage = deals.reduce<Record<string, number>>((acc, d) => {
    const k = d.lecipmExecutionPipelineState ?? "unknown";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  const durationsMs = deals
    .filter((d) => d.lecipmExecutionPipelineState === "closed")
    .map((d) => d.updatedAt.getTime() - d.createdAt.getTime());
  const avgCloseMs =
    durationsMs.length > 0 ? durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length : null;

  return {
    totalDeals: total,
    closedDeals: closed,
    completionRate: total > 0 ? closed / total : 0,
    avgTimeToCloseMs: avgCloseMs,
    stageDistribution: byStage,
    generatedAt: new Date().toISOString(),
  };
}
