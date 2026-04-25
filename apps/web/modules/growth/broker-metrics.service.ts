import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export type BrokerGrowthMetrics = {
  totalBrokers: number;
  newBrokers7d: number;
  activeBrokers: number;
  activationRate: number;
  /** Brokers with any `broker_activity` row in the last 14 days / total. */
  retentionRate14d: number;
};

async function countActiveBrokers(brokerIdSet: Set<string>): Promise<number> {
  if (brokerIdSet.size === 0) return 0;
  const ids = Array.from(brokerIdSet);

  const [aiOnes, contactOnes, leadViewGroups] = await Promise.all([
    prisma.brokerActivity.findMany({
      where: { brokerId: { in: ids }, eventType: "ai_suggestion_used" },
      distinct: ["brokerId"],
      select: { brokerId: true },
    }),
    prisma.brokerActivity.findMany({
      where: { brokerId: { in: ids }, eventType: "contact_attempt" },
      distinct: ["brokerId"],
      select: { brokerId: true },
    }),
    prisma.brokerActivity.groupBy({
      by: ["brokerId", "refId"],
      where: { brokerId: { in: ids }, eventType: "lead_viewed", refId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const active = new Set<string>();
  for (const r of aiOnes) active.add(r.brokerId);
  for (const r of contactOnes) active.add(r.brokerId);

  const perBroker = new Map<string, number>();
  for (const row of leadViewGroups) {
    if (!row.refId) continue;
    perBroker.set(row.brokerId, (perBroker.get(row.brokerId) ?? 0) + 1);
  }
  for (const [bid, c] of perBroker) {
    if (c >= 3) active.add(bid);
  }

  return active.size;
}

/**
 * Funnel & activation metrics (growth / admin). Uses last-14d activity as a simple retention signal.
 */
export async function getBrokerGrowthMetrics(): Promise<BrokerGrowthMetrics> {
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const d14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [totalBrokers, newBrokers7d, allBrokerRows, recentActivityBrokers] = await Promise.all([
    prisma.user.count({ where: { role: PlatformRole.BROKER } }),
    prisma.user.count({ where: { role: PlatformRole.BROKER, createdAt: { gte: d7 } } }),
    prisma.user.findMany({ where: { role: PlatformRole.BROKER }, select: { id: true } }),
    prisma.brokerActivity.findMany({
      where: { createdAt: { gte: d14 } },
      distinct: ["brokerId"],
      select: { brokerId: true },
    }),
  ]);

  const idSet = new Set(allBrokerRows.map((b) => b.id));
  const activeBrokers = await countActiveBrokers(idSet);
  const activationRate = totalBrokers > 0 ? activeBrokers / totalBrokers : 0;
  const retained = new Set(recentActivityBrokers.map((r) => r.brokerId));
  const retentionRate14d = totalBrokers > 0 ? retained.size / totalBrokers : 0;

  return {
    totalBrokers,
    newBrokers7d,
    activeBrokers,
    activationRate,
    retentionRate14d,
  };
}
