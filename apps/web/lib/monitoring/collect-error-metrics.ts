import { prisma } from "@/lib/db";
import type { ErrorMetricsSlice } from "./types";

export async function collectErrorMetrics(start: Date, end: Date): Promise<ErrorMetricsSlice> {
  const [totalInRange, byTypeRows, recent] = await Promise.all([
    prisma.errorEvent.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.errorEvent.groupBy({
      by: ["errorType"],
      where: { createdAt: { gte: start, lte: end } },
      _count: { _all: true },
    }),
    prisma.errorEvent.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { id: true, errorType: true, message: true, route: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const byType: Record<string, number> = {};
  for (const row of byTypeRows) {
    byType[row.errorType] = row._count._all;
  }

  return {
    totalInRange,
    byType,
    recent: recent.map((e) => ({
      id: e.id,
      errorType: e.errorType,
      message: e.message.slice(0, 500),
      route: e.route,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}
