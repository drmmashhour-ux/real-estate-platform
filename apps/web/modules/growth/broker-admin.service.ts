import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export type NewBrokerRow = { id: string; email: string; name: string | null; createdAt: Date };

export type TopBrokerRow = {
  id: string;
  email: string;
  name: string | null;
  openLeads: number;
};

/**
 * New signups, leaderboards by open CRM work, and batch “active” flags (same rules as `getBrokerGrowthMetrics`).
 */
export async function getBrokerAdminSnapshot(): Promise<{
  newBrokers: NewBrokerRow[];
  topPerformers: TopBrokerRow[];
  activeBrokerIds: string[];
}> {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const brokers = await prisma.user.findMany({
    where: { role: PlatformRole.BROKER },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  const idSet = new Set(brokers.map((b) => b.id));
  const ids = Array.from(idSet);

  const [newBrokers, leadCounts, aiOnes, contactOnes, leadViewGroups] = await Promise.all([
    prisma.user.findMany({
      where: { role: PlatformRole.BROKER, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, email: true, name: true, createdAt: true },
    }),
    prisma.lecipmBrokerCrmLead.groupBy({
      by: ["brokerUserId"],
      where: { status: { notIn: ["lost", "closed"] } },
      _count: { _all: true },
    }),
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

  const countBy = new Map(leadCounts.map((r) => [r.brokerUserId, r._count._all]));
  const topPerformers: TopBrokerRow[] = brokers
    .map((b) => ({
      id: b.id,
      email: b.email,
      name: b.name,
      openLeads: countBy.get(b.id) ?? 0,
    }))
    .sort((a, b) => b.openLeads - a.openLeads)
    .slice(0, 20);

  return { newBrokers, topPerformers, activeBrokerIds: Array.from(active) };
}
