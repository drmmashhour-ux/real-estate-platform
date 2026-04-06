import { prisma } from "@/lib/db";
import type { NotificationMetricsSlice } from "./types";

export async function collectNotificationMetrics(start: Date, end: Date): Promise<NotificationMetricsSlice> {
  const [notificationsCreated, byTypeRows] = await Promise.all([
    prisma.notification.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.notification.groupBy({
      by: ["type"],
      where: { createdAt: { gte: start, lte: end } },
      _count: { _all: true },
    }),
  ]);

  const byType: Record<string, number> = {};
  for (const row of byTypeRows) {
    byType[row.type] = row._count._all;
  }

  return { notificationsCreated, byType };
}
