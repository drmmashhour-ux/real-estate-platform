/**
 * Aggregates audit rows for expansion evidence — read-only.
 */

import { prisma } from "@/lib/db";

export type ExecutionKeyStats = {
  lowRiskActionKey: string;
  total: number;
  undone: number;
};

export async function aggregateExecutionStatsByActionKey(args: { since: Date }): Promise<ExecutionKeyStats[]> {
  try {
    const rows = await prisma.growthAutonomyLowRiskExecution.findMany({
      where: { createdAt: { gte: args.since } },
      select: { lowRiskActionKey: true, reversedAt: true },
    });
    const map = new Map<string, { total: number; undone: number }>();
    for (const r of rows) {
      const cur = map.get(r.lowRiskActionKey) ?? { total: 0, undone: 0 };
      cur.total += 1;
      if (r.reversedAt) cur.undone += 1;
      map.set(r.lowRiskActionKey, cur);
    }
    return [...map.entries()].map(([lowRiskActionKey, v]) => ({
      lowRiskActionKey,
      total: v.total,
      undone: v.undone,
    }));
  } catch {
    return [];
  }
}

export async function countExecutionRowsSince(args: { since: Date }): Promise<number> {
  try {
    return await prisma.growthAutonomyLowRiskExecution.count({
      where: { createdAt: { gte: args.since } },
    });
  } catch {
    return 0;
  }
}

export async function sampleExplanationIntegrity(args: { since: Date; take: number }): Promise<{
  sampled: number;
  substantive: number;
}> {
  try {
    const rows = await prisma.growthAutonomyLowRiskExecution.findMany({
      where: { createdAt: { gte: args.since } },
      orderBy: { createdAt: "desc" },
      take: args.take,
      select: { explanation: true },
    });
    let substantive = 0;
    for (const r of rows) {
      if (typeof r.explanation === "string" && r.explanation.trim().length >= 24) substantive += 1;
    }
    return { sampled: rows.length, substantive };
  } catch {
    return { sampled: 0, substantive: 0 };
  }
}
