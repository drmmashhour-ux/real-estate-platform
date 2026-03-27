import { prisma } from "@/lib/db";

export const PRO_WEEKLY_FREE_CONTACT_UNLOCKS = 3;

/** Monday 00:00 UTC → next Monday 00:00 UTC */
export function utcWeekRange(now: Date): { start: Date; end: Date } {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay();
  const daysFromMonday = (day + 6) % 7;
  const start = new Date(d);
  start.setUTCDate(start.getUTCDate() - daysFromMonday);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return { start, end };
}

export async function countProFreeWeeklyUnlocks(brokerId: string, now = new Date()): Promise<number> {
  const { start, end } = utcWeekRange(now);
  return prisma.mortgageLeadUnlock.count({
    where: {
      brokerId,
      source: "free_weekly",
      createdAt: { gte: start, lt: end },
    },
  });
}
