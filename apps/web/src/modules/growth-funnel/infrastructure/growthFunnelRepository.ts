import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { FunnelEventName } from "@/src/modules/growth-funnel/domain/funnelEvents";
import { usageResetPeriod } from "@/src/modules/growth-funnel/domain/usageLimits";

function currentUsagePeriodKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function insertFunnelEvent(args: {
  userId: string | null;
  eventName: FunnelEventName;
  properties?: Record<string, unknown>;
}) {
  return prisma.growthFunnelEvent.create({
    data: {
      userId: args.userId,
      eventName: args.eventName,
      properties: (args.properties ?? {}) as object,
    },
  });
}

export async function getOrCreateUsageCounter(userId: string) {
  const monthly = usageResetPeriod() === "monthly";
  const key = monthly ? currentUsagePeriodKey() : null;
  const row = await prisma.growthUsageCounter.upsert({
    where: { userId },
    create: {
      userId,
      resetPeriod: monthly ? "monthly" : "lifetime",
      usagePeriodKey: key,
    },
    update: {},
  });
  if (monthly && row.usagePeriodKey !== key) {
    return prisma.growthUsageCounter.update({
      where: { userId },
      data: {
        simulatorRuns: 0,
        aiDrafts: 0,
        usagePeriodKey: key,
        resetPeriod: "monthly",
      },
    });
  }
  return row;
}

export async function incrementSimulatorRuns(userId: string) {
  return prisma.growthUsageCounter.upsert({
    where: { userId },
    create: { userId, simulatorRuns: 1 },
    update: { simulatorRuns: { increment: 1 } },
  });
}

export async function incrementAiDrafts(userId: string) {
  return prisma.growthUsageCounter.upsert({
    where: { userId },
    create: { userId, aiDrafts: 1 },
    update: { aiDrafts: { increment: 1 } },
  });
}

export async function markReturnVisit(userId: string) {
  return prisma.growthUsageCounter.upsert({
    where: { userId },
    create: { userId, lastReturnVisitAt: new Date() },
    update: { lastReturnVisitAt: new Date() },
  });
}

export async function markActivationCompleted(userId: string) {
  return prisma.growthUsageCounter.upsert({
    where: { userId },
    create: { userId, activationCompletedAt: new Date() },
    update: { activationCompletedAt: new Date() },
  });
}

export async function countEventsByName(eventName: string, since: Date): Promise<number> {
  return prisma.growthFunnelEvent.count({
    where: { eventName, createdAt: { gte: since } },
  });
}

export async function countEventsByNameInRange(eventName: string, windowStart: Date, windowEnd: Date): Promise<number> {
  return prisma.growthFunnelEvent.count({
    where: { eventName, createdAt: { gte: windowStart, lt: windowEnd } },
  });
}

export async function countDistinctUsersWithEvent(eventName: string, since: Date): Promise<number> {
  const rows = await prisma.growthFunnelEvent.groupBy({
    by: ["userId"],
    where: { eventName, createdAt: { gte: since }, userId: { not: null } },
  });
  return rows.filter((r) => r.userId != null).length;
}

export async function countDistinctUsersWithEventInRange(
  eventName: string,
  windowStart: Date,
  windowEnd: Date
): Promise<number> {
  const rows = await prisma.growthFunnelEvent.groupBy({
    by: ["userId"],
    where: { eventName, createdAt: { gte: windowStart, lt: windowEnd }, userId: { not: null } },
  });
  return rows.filter((r) => r.userId != null).length;
}

/** Users who registered on or after `since`. */
export async function countNewUsersSince(since: Date): Promise<number> {
  return prisma.user.count({ where: { createdAt: { gte: since } } });
}

export async function countNewUsersInRange(windowStart: Date, windowEnd: Date): Promise<number> {
  return prisma.user.count({
    where: { createdAt: { gte: windowStart, lt: windowEnd } },
  });
}

/** Total simulator run events (one row per successful run). */
export async function countSimulatorRunEventsSince(since: Date): Promise<number> {
  return countEventsByName("simulator_used", since);
}

/**
 * Distinct users who logged `secondEvent` at or after `firstEvent`, both events in `[windowStart, windowEnd)`.
 */
export async function countSequentialFlowUsers(
  firstEvent: FunnelEventName,
  secondEvent: FunnelEventName,
  windowStart: Date,
  windowEnd: Date
): Promise<number> {
  const rows = await prisma.$queryRaw<[{ count: bigint }]>(
    Prisma.sql`
      SELECT COUNT(DISTINCT a.user_id)::bigint AS count
      FROM growth_funnel_events a
      INNER JOIN growth_funnel_events b
        ON a.user_id = b.user_id
        AND b.event_name = ${secondEvent}
        AND b.created_at >= a.created_at
        AND b.created_at >= ${windowStart}
        AND b.created_at < ${windowEnd}
      WHERE a.event_name = ${firstEvent}
        AND a.created_at >= ${windowStart}
        AND a.created_at < ${windowEnd}
        AND a.user_id IS NOT NULL
    `
  );
  return Number(rows[0]?.count ?? 0);
}

export type DailyBucket = { date: string; newUsers: number; simulatorRuns: number };

/** Last `dayCount` UTC days ending today (inclusive), one bucket per day. */
export async function getDailyNewUsersAndSimulatorRuns(dayCount: number): Promise<DailyBucket[]> {
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const buckets: DailyBucket[] = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const dayStart = new Date(todayUtc);
    dayStart.setUTCDate(dayStart.getUTCDate() - i);
    const nextDay = new Date(dayStart);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const [newUsers, simulatorRuns] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: dayStart, lt: nextDay } },
      }),
      prisma.growthFunnelEvent.count({
        where: { eventName: "simulator_used", createdAt: { gte: dayStart, lt: nextDay } },
      }),
    ]);
    buckets.push({
      date: dayStart.toISOString().slice(0, 10),
      newUsers,
      simulatorRuns,
    });
  }
  return buckets;
}
