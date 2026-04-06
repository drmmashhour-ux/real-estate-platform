import type { PrismaClient } from "@prisma/client";

export type GrowthEngineDashboardMetrics = {
  leadsCreatedToday: number;
  leadsContacted: number;
  leadsInterested: number;
  conversionRate: number;
  topCity: string | null;
  topSource: string | null;
  byStage: Record<string, number>;
};

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export async function getGrowthEngineDashboardMetrics(prisma: PrismaClient): Promise<GrowthEngineDashboardMetrics> {
  const today = startOfUtcDay(new Date());

  const [createdToday, contacted, interested, converted, totalActive, cityRows, sourceRows, stageGroups] =
    await Promise.all([
      prisma.growthEngineLead.count({ where: { createdAt: { gte: today }, archivedAt: null } }),
      prisma.growthEngineLead.count({ where: { stage: "contacted", archivedAt: null } }),
      prisma.growthEngineLead.count({ where: { stage: "interested", archivedAt: null } }),
      prisma.growthEngineLead.count({ where: { stage: "converted", archivedAt: null } }),
      prisma.growthEngineLead.count({ where: { archivedAt: null } }),
      prisma.growthEngineLead.groupBy({
        by: ["city"],
        where: { archivedAt: null, city: { not: null } },
        _count: { city: true },
        orderBy: { _count: { city: "desc" } },
        take: 1,
      }),
      prisma.growthEngineLead.groupBy({
        by: ["source"],
        where: { archivedAt: null },
        _count: { source: true },
        orderBy: { _count: { source: "desc" } },
        take: 1,
      }),
      prisma.growthEngineLead.groupBy({
        by: ["stage"],
        where: { archivedAt: null },
        _count: { stage: true },
      }),
    ]);

  const conversionRate = totalActive > 0 ? Math.round((converted / totalActive) * 1000) / 10 : 0;
  const byStage: Record<string, number> = {};
  for (const g of stageGroups) {
    byStage[g.stage] = g._count.stage;
  }

  return {
    leadsCreatedToday: createdToday,
    leadsContacted: contacted,
    leadsInterested: interested,
    conversionRate,
    topCity: cityRows[0]?.city ?? null,
    topSource: sourceRows[0]?.source ?? null,
    byStage,
  };
}

/** Analytics-style event names for growth UI (aggregate from DB). */
export const GROWTH_METRIC_EVENTS = [
  "leads_created",
  "leads_contacted",
  "leads_interested",
  "listings_created",
  "users_signed_up",
  "unlocks",
  "bookings",
] as const;
