import { prisma } from "@/lib/db";

/** Aggregates experiment events for admin review — no p-values; descriptive counts only. */
export async function aggregateExperimentMetrics(experimentId: string, since: Date): Promise<Record<string, number>> {
  const rows = await prisma.experimentEvent.groupBy({
    by: ["eventName"],
    where: { experimentId, createdAt: { gte: since } },
    _count: { _all: true },
  });
  const out: Record<string, number> = {};
  for (const r of rows) {
    out[r.eventName] = r._count._all;
  }
  return out;
}
