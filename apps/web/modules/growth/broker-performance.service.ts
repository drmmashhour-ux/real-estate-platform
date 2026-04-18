/**
 * Read-only broker monetization signals — additive; does not change Stripe or CRM writes.
 */

import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

const LEAD_EVENT_TYPES = ["lead_unlock", "lead_purchased"] as const;

/** CAD spent threshold for VIP classification (operator-tunable constant). */
const VIP_MIN_SPEND_CAD = 200;
const VIP_MIN_LEADS = 5;

export type BrokerPerformanceRow = {
  userId: string;
  email: string | null;
  leadsPurchased: number;
  moneySpentCad: number;
  /** 0–1 proxy: repeat monetization events */
  repeatPurchaseProxy: number;
  isVip: boolean;
  lastPurchaseAt: string | null;
};

function aggregateByUser(
  rows: { userId: string | null; amount: number; createdAt: Date }[],
): Map<string, { total: number; count: number; lastAt: Date }> {
  const m = new Map<string, { total: number; count: number; lastAt: Date }>();
  for (const r of rows) {
    if (!r.userId) continue;
    const a = Number(r.amount);
    if (!Number.isFinite(a) || a <= 0) continue;
    const cur = m.get(r.userId);
    if (!cur) {
      m.set(r.userId, { total: a, count: 1, lastAt: r.createdAt });
    } else {
      cur.total += a;
      cur.count += 1;
      if (r.createdAt > cur.lastAt) cur.lastAt = r.createdAt;
    }
  }
  return m;
}

/**
 * Top brokers by lifetime lead-monetization spend (RevenueEvent), enriched with role check.
 */
export async function getBrokerPerformanceSummaries(limit = 20): Promise<BrokerPerformanceRow[]> {
  const rows = await prisma.revenueEvent.findMany({
    where: {
      eventType: { in: [...LEAD_EVENT_TYPES] },
      amount: { gt: 0 },
      userId: { not: null },
    },
    select: { userId: true, amount: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 50_000,
  });

  const agg = aggregateByUser(rows as { userId: string | null; amount: number; createdAt: Date }[]);
  const entries = [...agg.entries()]
    .map(([userId, v]) => {
      const repeatPurchaseProxy = v.count > 1 ? Math.min(1, 0.4 + (v.count - 2) * 0.15) : 0;
      const isVip = v.total >= VIP_MIN_SPEND_CAD || v.count >= VIP_MIN_LEADS;
      return {
        userId,
        leadsPurchased: v.count,
        moneySpentCad: Math.round(v.total * 100) / 100,
        repeatPurchaseProxy: Math.round(repeatPurchaseProxy * 100) / 100,
        isVip,
        lastPurchaseAt: v.lastAt.toISOString(),
        sortKey: v.total,
      };
    })
    .sort((a, b) => b.sortKey - a.sortKey)
    .slice(0, limit);

  const users = await prisma.user.findMany({
    where: {
      id: { in: entries.map((e) => e.userId) },
      role: PlatformRole.BROKER,
    },
    select: { id: true, email: true },
  });
  const emailById = new Map(users.map((u) => [u.id, u.email]));

  return entries
    .filter((e) => emailById.has(e.userId))
    .map((e) => ({
      userId: e.userId,
      email: emailById.get(e.userId) ?? null,
      leadsPurchased: e.leadsPurchased,
      moneySpentCad: e.moneySpentCad,
      repeatPurchaseProxy: e.repeatPurchaseProxy,
      isVip: e.isVip,
      lastPurchaseAt: e.lastPurchaseAt,
    }));
}
