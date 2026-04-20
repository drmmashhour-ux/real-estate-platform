/**
 * Compares latest two **portfolio** BNHub metric snapshots for a host (deterministic thresholds).
 */

import { prisma } from "@/lib/db";

export type RevenueAnomalyEvent = {
  type: string;
  status: string;
  message: string;
};

export async function detectRevenueAnomalies(hostUserId: string): Promise<RevenueAnomalyEvent[]> {
  const snapshots = await prisma.bnhubRevenueMetricSnapshot.findMany({
    where: {
      scopeType: "portfolio",
      scopeId: hostUserId,
    },
    orderBy: { snapshotDate: "desc" },
    take: 7,
  });

  if (snapshots.length < 2) return [];

  const [latest, previous] = snapshots;
  const events: RevenueAnomalyEvent[] = [];

  if (previous.grossRevenue > 0 && latest.grossRevenue < previous.grossRevenue * 0.6) {
    events.push({
      type: "anomaly",
      status: "info",
      message: "Gross revenue dropped materially versus the prior snapshot (below 60% of previous).",
    });
  }

  if (previous.occupancyRate > 0 && latest.occupancyRate < previous.occupancyRate * 0.7) {
    events.push({
      type: "anomaly",
      status: "info",
      message: "Occupancy rate dropped materially versus the prior snapshot (below 70% of previous).",
    });
  }

  return events;
}
