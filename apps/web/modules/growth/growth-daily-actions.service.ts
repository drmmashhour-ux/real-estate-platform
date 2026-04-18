/**
 * Daily growth execution stats — DB signals + optional in-memory overlay (`growth-daily-actions.store`).
 * Does not change payments; read-only Prisma queries.
 */

import { prisma } from "@/lib/db";
import { getDailyActionOverlay, utcDayKey } from "./growth-daily-actions.store";
import { getDailyGrowthTasks, type GrowthTaskItem } from "./growth-task-engine.service";

export type DailyActionStats = {
  brokersContacted: number;
  followUpsSent: number;
  leadsShown: number;
  leadsSold: number;
};

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

const LEAD_REVENUE_TYPES = ["lead_unlock", "lead_purchased"] as const;

export async function buildDailyActionStats(): Promise<DailyActionStats> {
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const tomorrowStart = addUtcDays(todayStart, 1);
  const dayKey = utcDayKey(now);

  const [brokersContactedDb, followUpsDb, leadsShownDb, leadsSoldDb] = await Promise.all([
    prisma.brokerProspect.count({
      where: {
        lastCloseContactAt: { gte: todayStart, lt: tomorrowStart },
      },
    }),
    prisma.lead.count({
      where: {
        lastFollowUpAt: { gte: todayStart, lt: tomorrowStart },
      },
    }),
    prisma.lead.count({
      where: {
        createdAt: { gte: todayStart, lt: tomorrowStart },
      },
    }),
    prisma.revenueEvent.count({
      where: {
        createdAt: { gte: todayStart, lt: tomorrowStart },
        amount: { gt: 0 },
        eventType: { in: [...LEAD_REVENUE_TYPES] },
      },
    }),
  ]);

  const overlay = getDailyActionOverlay(dayKey);

  return {
    brokersContacted: brokersContactedDb + overlay.brokersContacted,
    followUpsSent: followUpsDb + overlay.followUpsSent,
    leadsShown: leadsShownDb + overlay.leadsShown,
    leadsSold: leadsSoldDb + overlay.leadsSold,
  };
}

/** Daily checklist tasks derived from `buildDailyActionStats` + task rules. */
export async function getDailyTasks(): Promise<{ actions: DailyActionStats; tasks: GrowthTaskItem[] }> {
  const actions = await buildDailyActionStats();
  return { actions, tasks: getDailyGrowthTasks(actions) };
}
