import { prisma } from "@/lib/db";
import { EntityPerformance } from "./empire.types";

/**
 * Aggregate by entity:
 * - revenue
 * - growth
 * - burn / spend
 * - active users
 * - strategic status
 */

export async function aggregateEntityPerformance(entityId: string): Promise<EntityPerformance | null> {
  // @ts-ignore
  const entity = await prisma.empireEntity.findUnique({
    where: { id: entityId },
  });

  if (!entity) return null;

  // Placeholder: In production, this would join with per-company analytics/stripe/DBs
  const revenue = Math.random() * 500000;
  const growth = Math.random() * 0.5;
  const burn = Math.random() * 100000;
  const activeUsers = Math.floor(Math.random() * 10000);

  let status: EntityPerformance["status"] = "STABLE";
  if (revenue > 400000 && growth > 0.3) status = "STRONG";
  if (burn > revenue * 1.5) status = "WEAK";
  if (burn > revenue * 3) status = "CRITICAL";

  return {
    entityId: entity.id,
    name: entity.name,
    type: entity.entityType,
    revenue,
    growth,
    burn,
    activeUsers,
    status,
    strategicScore: Math.floor(Math.random() * 100),
  };
}

export async function summarizeEmpirePerformance() {
  // @ts-ignore
  const entities = await prisma.empireEntity.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const performances = await Promise.all(entities.map((e: any) => aggregateEntityPerformance(e.id)));
  const valid = performances.filter((p): p is EntityPerformance => p !== null);

  return {
    scorecards: valid,
    groupSummary: {
      totalRevenue: valid.reduce((acc, p) => acc + p.revenue, 0),
      avgGrowth: valid.reduce((acc, p) => acc + p.growth, 0) / (valid.length || 1),
      totalBurn: valid.reduce((acc, p) => acc + p.burn, 0),
    },
    strongEntities: valid.filter((p) => p.status === "STRONG"),
    weakEntities: valid.filter((p) => p.status === "WEAK" || p.status === "CRITICAL"),
  };
}
