/**
 * Read-only revenue dashboard aggregates — RevenueEvent, Lead, User, AiConversionSignal.
 * Does not mutate Stripe, webhooks, or pricing.
 */

import { AccountStatus, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getRevenueMonitoringSnapshot } from "@/modules/revenue/revenue-monitoring.service";
import type { RevenueDashboardSummary, RevenueSource } from "./revenue-dashboard.types";
import { detectRevenueAlerts } from "./revenue-dashboard-alerts.service";
import {
  recordMissingDataWarning,
  recordRevenueDashboardAlertsGenerated,
  recordRevenueDashboardBuild,
  recordWeakUnlockRateDetected,
  recordZeroRevenueDayDetected,
} from "./revenue-dashboard-monitoring.service";

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addUtcDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function startOfUtcMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

function emptyBySource(): Record<RevenueSource, number> {
  return {
    lead_unlock: 0,
    booking_fee: 0,
    boost: 0,
    subscription: 0,
    other: 0,
  };
}

function mapEventTypeToSource(eventType: string): RevenueSource {
  const t = eventType.toLowerCase();
  if (t === "lead_unlock" || t === "lead_purchased" || t === "lead_unlocked") return "lead_unlock";
  if (t === "booking_fee" || t.includes("booking_fee") || t.includes("bnhub_guest_booking_service")) return "booking_fee";
  if (t === "boost") return "boost";
  if (t === "subscription" || t.includes("subscription")) return "subscription";
  return "other";
}

async function sumRevenueBySourceInRange(
  from: Date,
  toExclusive: Date,
): Promise<{ total: number; bySource: Record<RevenueSource, number> }> {
  const rows = await prisma.revenueEvent.findMany({
    where: {
      createdAt: { gte: from, lt: toExclusive },
      amount: { gt: 0 },
    },
    select: { eventType: true, amount: true },
  });

  const bySource = emptyBySource();
  let total = 0;
  for (const r of rows) {
    const a = Number(r.amount);
    if (!Number.isFinite(a) || a <= 0) continue;
    total += a;
    bySource[mapEventTypeToSource(r.eventType)] += a;
  }
  return { total, bySource };
}

/**
 * Builds the operator revenue dashboard snapshot (UTC day boundaries).
 */
export async function buildRevenueDashboardSummary(): Promise<RevenueDashboardSummary> {
  recordRevenueDashboardBuild();
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const tomorrowStart = addUtcDays(todayStart, 1);
  const weekStart = addUtcDays(todayStart, -6);
  const monthStart = startOfUtcMonth(now);
  const thirtyDaysAgo = addUtcDays(startOfUtcDay(now), -29);

  const notes: string[] = [];

  const [
    todayAgg,
    weekAgg,
    monthAgg,
    leadViewsDb,
    leadsGen,
    leadsUnlocked,
    activeBrokers,
    recentPayingUsers,
    bookingStarts,
    bookingCompleted,
    monitoring,
  ] = await Promise.all([
    sumRevenueBySourceInRange(todayStart, tomorrowStart),
    sumRevenueBySourceInRange(weekStart, tomorrowStart),
    sumRevenueBySourceInRange(monthStart, tomorrowStart),
    prisma.revenueEvent
      .count({
        where: {
          createdAt: { gte: weekStart, lt: tomorrowStart },
          eventType: "lead_viewed",
        },
      })
      .catch(() => 0),
    prisma.lead.count({
      where: { createdAt: { gte: weekStart, lt: tomorrowStart } },
    }),
    prisma.lead.count({
      where: {
        createdAt: { gte: weekStart, lt: tomorrowStart },
        contactUnlockedAt: { not: null },
      },
    }),
    prisma.user.count({
      where: { role: PlatformRole.BROKER, accountStatus: AccountStatus.ACTIVE },
    }),
    prisma.revenueEvent.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo, lt: tomorrowStart },
        amount: { gt: 0 },
        userId: { not: null },
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.aiConversionSignal
      .count({
        where: { createdAt: { gte: weekStart, lt: tomorrowStart }, eventType: "booking_started" },
      })
      .catch(() => 0),
    prisma.aiConversionSignal
      .count({
        where: { createdAt: { gte: weekStart, lt: tomorrowStart }, eventType: "booking_completed" },
      })
      .catch(() => 0),
    Promise.resolve(getRevenueMonitoringSnapshot()),
  ]);

  let leadsViewed = leadViewsDb;
  if (leadsViewed === 0 && monitoring.leadViews > 0) {
    leadsViewed = monitoring.leadViews;
    notes.push("Lead views include in-memory enforcement counters — durable lead_viewed rows may be sparse.");
    recordMissingDataWarning();
  } else if (leadsViewed === 0 && leadsGen > 0) {
    notes.push("No durable lead_viewed events in-window — unlock rate denominator may be incomplete.");
    recordMissingDataWarning();
  }

  let payingBrokers = 0;
  const userIds = recentPayingUsers.map((e) => e.userId).filter((id): id is string => Boolean(id));
  if (userIds.length > 0) {
    payingBrokers = await prisma.user.count({
      where: {
        id: { in: userIds },
        role: PlatformRole.BROKER,
      },
    });
  }

  const leadUnlockRate = leadsUnlocked / Math.max(1, leadsViewed);
  if (leadUnlockRate < 0.05 && leadsViewed >= 10) {
    recordWeakUnlockRateDetected();
  }

  const bookingCompletionRate = bookingCompleted / Math.max(1, bookingStarts);

  if (bookingStarts === 0 && monitoring.bookingStarted > 0) {
    notes.push("Booking start counts may include enforcement in-memory signals not yet in AiConversionSignal.");
    recordMissingDataWarning();
  }

  const revenuePerBroker = weekAgg.total / Math.max(1, payingBrokers);

  if (todayAgg.total === 0) {
    recordZeroRevenueDayDetected();
  }

  if (weekAgg.bySource.boost === 0 && weekAgg.bySource.subscription === 0) {
    notes.push("Boost/subscription revenue has not appeared in RevenueEvent for this window (may be early-stage).");
  }

  const dominant = Object.entries(weekAgg.bySource).sort((a, b) => b[1] - a[1])[0];
  if (dominant && dominant[1] > 0) {
    if (dominant[0] === "lead_unlock") {
      notes.push("Lead unlock revenue is the dominant source this week (by RevenueEvent).");
    }
  }

  if (bookingStarts >= 3 && bookingCompletionRate < 0.25) {
    notes.push("Booking flow is active but completion rate is weak in-window — see funnel alerts.");
  }

  if (payingBrokers <= 1 && activeBrokers > 3) {
    notes.push("Broker monetization remains early-stage relative to active brokers.");
  }

  const summary: RevenueDashboardSummary = {
    revenueToday: todayAgg.total,
    revenueWeek: weekAgg.total,
    revenueMonth: monthAgg.total,
    revenueBySource: weekAgg.bySource,
    leadsViewed,
    leadsUnlocked,
    leadUnlockRate,
    activeBrokers,
    payingBrokers,
    revenuePerBroker,
    bookingStarts,
    bookingCompleted,
    bookingCompletionRate,
    alerts: [],
    notes,
    createdAt: new Date().toISOString(),
  };

  summary.alerts = detectRevenueAlerts(summary);
  recordRevenueDashboardAlertsGenerated(summary.alerts.length);

  return summary;
}
