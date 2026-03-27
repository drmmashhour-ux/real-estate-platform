import type { PrismaClient } from "@prisma/client";
import { SubscriptionStatus } from "@prisma/client";
import { getChurnRate } from "@/modules/revenue/application/getChurnRate";
import { getMRR } from "@/modules/revenue/application/getMRR";

const PAYING: SubscriptionStatus[] = [
  SubscriptionStatus.trialing,
  SubscriptionStatus.active,
  SubscriptionStatus.past_due,
];

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export type KpiSnapshot = {
  computedAt: string;
  daily_signups: number;
  daily_signups_prior_day: number;
  signups_last_7_days: { date: string; count: number }[];
  active_users_7d: number;
  activation_rate: number | null;
  activation_numerator: number;
  activation_denominator: number;
  conversion_rate: number | null;
  conversion_numerator: number;
  conversion_denominator: number;
  retention_rate: number | null;
  retention_numerator: number;
  retention_denominator: number;
  mrr: number | null;
  mrr_cents_approx: number | null;
  active_subscriptions: number;
  churn_rate: number | null;
  churn_window: { start: string; end: string };
  time_to_value_median_minutes: number | null;
  top_actions: string[];
  definitions: Record<string, string>;
};

/**
 * Core business KPIs for internal admin dashboard (deterministic from Prisma).
 */
export async function loadKpiSnapshot(db: PrismaClient): Promise<KpiSnapshot> {
  const now = new Date();
  const startOfToday = utcDayStart(now);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setUTCDate(startOfYesterday.getUTCDate() - 1);
  const start30d = new Date(startOfToday);
  start30d.setUTCDate(start30d.getUTCDate() - 30);
  const start7d = new Date(startOfToday);
  start7d.setUTCDate(start7d.getUTCDate() - 7);
  const cohortEnd = new Date(startOfToday);
  cohortEnd.setUTCDate(cohortEnd.getUTCDate() - 8);
  const cohortStart = new Date(startOfToday);
  cohortStart.setUTCDate(cohortStart.getUTCDate() - 30);

  const [
    daily_signups,
    daily_signups_prior_day,
    signups30d,
    activated30d,
    paying30d,
    cohortUsers,
    cohortReturned,
    mrrResult,
    churnWindow,
    usersForTtv,
  ] = await Promise.all([
    db.user.count({ where: { createdAt: { gte: startOfToday } } }),
    db.user.count({
      where: { createdAt: { gte: startOfYesterday, lt: startOfToday } },
    }),
    db.user.count({ where: { createdAt: { gte: start30d } } }),
    db.user.count({
      where: {
        createdAt: { gte: start30d },
        fsboListings: { some: { dealAnalyses: { some: {} } } },
      },
    }),
    db.user.count({
      where: {
        createdAt: { gte: start30d },
        lecipmSubscriptions: { some: { status: { in: PAYING } } },
      },
    }),
    db.user.count({
      where: { createdAt: { gte: cohortStart, lt: cohortEnd } },
    }),
    db.user.count({
      where: {
        createdAt: { gte: cohortStart, lt: cohortEnd },
        OR: [
          { fsboListings: { some: { updatedAt: { gte: start7d } } } },
          { copilotRuns: { some: { createdAt: { gte: start7d } } } },
        ],
      },
    }),
    getMRR(db),
    Promise.resolve({
      start: start30d,
      end: now,
    }),
    db.user.findMany({
      where: { fsboListings: { some: { dealAnalyses: { some: {} } } } },
      select: {
        createdAt: true,
        fsboListings: {
          select: {
            dealAnalyses: {
              orderBy: { createdAt: "asc" },
              take: 1,
              select: { createdAt: true },
            },
          },
        },
      },
      take: 400,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const churn = await getChurnRate(db, { start: churnWindow.start, end: churnWindow.end });

  const signups_last_7_days: { date: string; count: number }[] = await Promise.all(
    Array.from({ length: 7 }, async (_, i) => {
      const day = new Date(startOfToday);
      day.setUTCDate(day.getUTCDate() - (6 - i));
      const next = new Date(day);
      next.setUTCDate(next.getUTCDate() + 1);
      const count = await db.user.count({
        where: { createdAt: { gte: day, lt: next } },
      });
      return { date: day.toISOString().slice(0, 10), count };
    })
  );

  const [listingActive, copilotActive] = await Promise.all([
    db.user.findMany({
      where: { fsboListings: { some: { updatedAt: { gte: start7d } } } },
      select: { id: true },
    }),
    db.user.findMany({
      where: { copilotRuns: { some: { createdAt: { gte: start7d } } } },
      select: { id: true },
    }),
  ]);
  const activeSet = new Set<string>();
  for (const u of listingActive) activeSet.add(u.id);
  for (const u of copilotActive) activeSet.add(u.id);
  const active_users_7d = activeSet.size;

  const activation_rate = signups30d > 0 ? activated30d / signups30d : null;
  const conversion_rate = signups30d > 0 ? paying30d / signups30d : null;
  const retention_rate = cohortUsers > 0 ? cohortReturned / cohortUsers : null;

  const deltas: number[] = [];
  for (const u of usersForTtv) {
    let firstAnalysis: Date | null = null;
    for (const l of u.fsboListings) {
      const da = l.dealAnalyses[0];
      if (da?.createdAt && (!firstAnalysis || da.createdAt < firstAnalysis)) {
        firstAnalysis = da.createdAt;
      }
    }
    if (firstAnalysis && firstAnalysis > u.createdAt) {
      deltas.push((firstAnalysis.getTime() - u.createdAt.getTime()) / 60000);
    }
  }
  const time_to_value_median_minutes = median(deltas);

  const top_actions: string[] = [];
  const lowTrust = await db.fsboListing.count({
    where: { trustScore: { lt: 55, not: null } },
  });
  if (lowTrust > 0) top_actions.push(`${lowTrust} listing(s) with trust score under 55 — review seller hub.`);
  const noListing = await db.user.count({
    where: {
      createdAt: { gte: start30d },
      fsboListings: { none: {} },
    },
  });
  if (noListing > 0) top_actions.push(`${noListing} user(s) signed up in 30d with no FSBO listing yet.`);

  const mrrCents =
    mrrResult.mrr != null ? Math.round(mrrResult.mrr * 100) : null;

  return {
    computedAt: now.toISOString(),
    daily_signups,
    daily_signups_prior_day,
    signups_last_7_days,
    active_users_7d,
    activation_rate,
    activation_numerator: activated30d,
    activation_denominator: signups30d,
    conversion_rate,
    conversion_numerator: paying30d,
    conversion_denominator: signups30d,
    retention_rate,
    retention_numerator: cohortReturned,
    retention_denominator: cohortUsers,
    mrr: mrrResult.mrr,
    mrr_cents_approx: mrrCents,
    active_subscriptions: mrrResult.activeSubscriptionCount,
    churn_rate: churn.churnRate,
    churn_window: { start: churn.windowStart, end: churn.windowEnd },
    time_to_value_median_minutes,
    top_actions,
    definitions: {
      daily_signups: "Users created since 00:00 UTC today.",
      activation_rate: "Share of users who signed up in the last 30d with at least one FSBO listing that has a deal analysis.",
      conversion_rate: "Share of users who signed up in the last 30d with an active/trialing/past_due LECIPM subscription.",
      retention_rate:
        "Share of users who signed up between 8–30 days ago with FSBO or Copilot activity in the last 7 days (proxy).",
      mrr: "Sum of subscription mrrCents / 100 for paying statuses (Stripe-backed where synced).",
      churn_rate: "Canceled subscriptions in window vs paying + canceled in window (see revenue module).",
      time_to_value_median_minutes:
        "Median minutes from user signup to first deal analysis on any of their listings (recent sample, max 400 users).",
    },
  };
}
