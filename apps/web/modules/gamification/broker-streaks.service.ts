import { prisma } from "@/lib/db";
import type { StreakType } from "@/modules/gamification/broker-gamification.types";

export async function getStreaks(brokerId: string): Promise<{ type: StreakType; count: number }[]> {
  const rows = await prisma.brokerStreak.findMany({
    where: { brokerId },
  });
  return rows.map((r) => ({ type: r.streakType as StreakType, count: r.count }));
}

/** Upsert streak counter — soft engagement only. */
export async function bumpStreak(brokerId: string, streakType: StreakType, nextCount: number) {
  await prisma.brokerStreak.upsert({
    where: { brokerId_streakType: { brokerId, streakType } },
    create: { brokerId, streakType, count: Math.max(0, nextCount) },
    update: { count: Math.max(0, nextCount) },
  });
}

/**
 * One increment per calendar day max — rewards consistency without harsh resets on quiet days.
 */
export async function updateActiveDayStreak(brokerId: string): Promise<number> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const hadToday = await prisma.brokerPointsLedger.findFirst({
    where: { brokerId, createdAt: { gte: todayStart }, points: { gt: 0 } },
    select: { id: true },
  });

  const row = await prisma.brokerStreak.findUnique({
    where: { brokerId_streakType: { brokerId, streakType: "ACTIVE_DAYS" } },
  });

  if (!hadToday) return row?.count ?? 0;

  if (row && row.updatedAt >= todayStart) return row.count;

  const hadYesterday = await prisma.brokerPointsLedger.findFirst({
    where: {
      brokerId,
      createdAt: { gte: yesterdayStart, lt: todayStart },
      points: { gt: 0 },
    },
    select: { id: true },
  });

  let next = 1;
  if (hadYesterday && row) next = row.count + 1;

  await bumpStreak(brokerId, "ACTIVE_DAYS", next);
  return next;
}
