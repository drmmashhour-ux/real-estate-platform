import { prisma } from "@/lib/db";

function utcDayStart(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function utcDayEndExclusive(d: Date): Date {
  const x = utcDayStart(d);
  x.setUTCDate(x.getUTCDate() + 1);
  return x;
}

/** Confirmed F1 `SyriaPaymentRequest` revenue — uses `confirmedAt` when set, else not included in time buckets. */
export async function getAdminMoneyStats() {
  const now = new Date();
  const startToday = utcDayStart(now);
  const endToday = utcDayEndExclusive(startToday);
  const weekAgo = new Date(now);
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);

  const [todaySum, weekSum, totalSum] = await Promise.all([
    prisma.syriaPaymentRequest.aggregate({
      where: { status: "confirmed", confirmedAt: { gte: startToday, lt: endToday } },
      _sum: { amount: true },
    }),
    prisma.syriaPaymentRequest.aggregate({
      where: { status: "confirmed", confirmedAt: { gte: weekAgo } },
      _sum: { amount: true },
    }),
    prisma.syriaPaymentRequest.aggregate({
      where: { status: "confirmed" },
      _sum: { amount: true },
    }),
  ]);

  return {
    today: todaySum._sum.amount ?? 0,
    week: weekSum._sum.amount ?? 0,
    total: totalSum._sum.amount ?? 0,
  };
}

export async function getAdminListingStats() {
  const now = new Date();
  const [total, active, pendingReview, archived, expiredBoost] = await Promise.all([
    prisma.syriaProperty.count(),
    prisma.syriaProperty.count({ where: { status: "PUBLISHED" } }),
      prisma.syriaProperty.count({ where: { status: { in: ["PENDING_REVIEW", "NEEDS_REVIEW"] } } }),
    prisma.syriaProperty.count({ where: { status: "ARCHIVED" } }),
    prisma.syriaProperty.count({
      where: {
        status: "PUBLISHED",
        featuredUntil: { not: null, lt: now },
      },
    }),
  ]);
  return { total, active, pendingReview, archived, expiredBoost };
}

export async function getAdminEngagementSums() {
  const s = await prisma.syriaProperty.aggregate({
    _sum: { views: true, whatsappClicks: true, phoneClicks: true },
  });
  return {
    views: s._sum.views ?? 0,
    whatsapp: s._sum.whatsappClicks ?? 0,
    phone: s._sum.phoneClicks ?? 0,
  };
}

export type DayCount = { dayKey: string; label: string; count: number };

/** Last 7 UTC days, `listing_view` growth events per day. */
export async function getLast7DaysListingViewTrend(locale: string): Promise<DayCount[]> {
  const isAr = locale.toLowerCase().startsWith("ar");
  const out: DayCount[] = [];
  for (let i = 6; i >= 0; i--) {
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - i);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    const c = await prisma.syriaGrowthEvent.count({
      where: {
        eventType: "listing_view",
        createdAt: { gte: start, lt: end },
      },
    });
    const dayKey = start.toISOString().slice(0, 10);
    const label = start.toLocaleDateString(isAr ? "ar-SY" : "en-GB", {
      day: "numeric",
      month: "short",
    });
    out.push({ dayKey, label, count: c });
  }
  return out;
}

const f1PlanFilter = { plan: { in: ["featured", "premium"] as string[] } };

export type F1TierKpi = { tier: 0 | 1 | 2; requests: number; confirmed: number; revenue: number };

/** F1 view ladder: tier 0 / 1 / 2 (stored on `pricingTier`). */
export async function getAdminF1PricingTierStats() {
  const tierNums = [0, 1, 2] as const;
  const rows: F1TierKpi[] = [];
  for (const tier of tierNums) {
    const [req, ok, sum] = await Promise.all([
      prisma.syriaPaymentRequest.count({ where: { ...f1PlanFilter, pricingTier: tier } }),
      prisma.syriaPaymentRequest.count({
        where: { ...f1PlanFilter, pricingTier: tier, status: "confirmed" },
      }),
      prisma.syriaPaymentRequest.aggregate({
        where: { ...f1PlanFilter, pricingTier: tier, status: "confirmed" },
        _sum: { amount: true },
      }),
    ]);
    rows.push({ tier, requests: req, confirmed: ok, revenue: sum._sum.amount ?? 0 });
  }
  return {
    tiers: rows,
    conversionRate0: rows[0].requests > 0 ? rows[0].confirmed / rows[0].requests : 0,
    conversionRate1: rows[1].requests > 0 ? rows[1].confirmed / rows[1].requests : 0,
    conversionRate2: rows[2].requests > 0 ? rows[2].confirmed / rows[2].requests : 0,
  };
}
