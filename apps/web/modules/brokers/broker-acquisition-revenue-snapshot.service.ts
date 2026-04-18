/**
 * DB-backed revenue snapshot for broker ops (UTC). Uses `RevenueEvent` — same source as revenue dashboard.
 */

import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function mapFeaturedSource(eventType: string): boolean {
  const t = eventType.toLowerCase();
  return t === "boost" || t.includes("featured") || t.includes("promotion");
}

function mapLeadSource(eventType: string): boolean {
  const t = eventType.toLowerCase();
  return t === "lead_unlock" || t === "lead_purchased" || t === "lead_unlocked";
}

export type BrokerAcquisitionRevenueSnapshot = {
  revenueTodayCad: number;
  revenueYesterdayCad: number;
  revenueFromLeadsCad: number;
  revenueFromFeaturedCad: number;
  revenuePerBroker: { userId: string; email: string | null; amountCad: number }[];
  revenueByDay: { day: string; totalCad: number }[];
};

export async function getBrokerAcquisitionRevenueSnapshot(): Promise<BrokerAcquisitionRevenueSnapshot> {
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);

  const thirtyDaysAgo = new Date(todayStart);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);

  const rows = await prisma.revenueEvent.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo, lt: tomorrowStart },
      amount: { gt: 0 },
      userId: { not: null },
    },
    select: {
      userId: true,
      eventType: true,
      amount: true,
      createdAt: true,
    },
  });

  let revenueTodayCad = 0;
  let revenueYesterdayCad = 0;
  let revenueFromLeadsCad = 0;
  let revenueFromFeaturedCad = 0;

  const byBroker = new Map<string, number>();
  const byDay = new Map<string, number>();

  for (const r of rows) {
    const amt = Number(r.amount);
    if (!Number.isFinite(amt) || amt <= 0) continue;
    const uid = r.userId!;
    const d = r.createdAt;
    if (d >= todayStart && d < tomorrowStart) revenueTodayCad += amt;
    if (d >= yesterdayStart && d < todayStart) revenueYesterdayCad += amt;
    if (mapLeadSource(r.eventType)) revenueFromLeadsCad += amt;
    if (mapFeaturedSource(r.eventType)) revenueFromFeaturedCad += amt;
    byBroker.set(uid, (byBroker.get(uid) ?? 0) + amt);
    const dayKey = d.toISOString().slice(0, 10);
    byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + amt);
  }

  const brokerIds = [...byBroker.keys()];
  const users =
    brokerIds.length > 0
      ? await prisma.user.findMany({
          where: {
            id: { in: brokerIds },
            role: PlatformRole.BROKER,
          },
          select: { id: true, email: true },
        })
      : [];

  const revenuePerBroker = users
    .map((u) => ({
      userId: u.id,
      email: u.email,
      amountCad: Math.round((byBroker.get(u.id) ?? 0) * 100) / 100,
    }))
    .filter((x) => x.amountCad > 0)
    .sort((a, b) => b.amountCad - a.amountCad)
    .slice(0, 25);

  const revenueByDay = [...byDay.entries()]
    .map(([day, totalCad]) => ({ day, totalCad: Math.round(totalCad * 100) / 100 }))
    .sort((a, b) => (a.day < b.day ? -1 : 1));

  return {
    revenueTodayCad: Math.round(revenueTodayCad * 100) / 100,
    revenueYesterdayCad: Math.round(revenueYesterdayCad * 100) / 100,
    revenueFromLeadsCad: Math.round(revenueFromLeadsCad * 100) / 100,
    revenueFromFeaturedCad: Math.round(revenueFromFeaturedCad * 100) / 100,
    revenuePerBroker,
    revenueByDay,
  };
}
