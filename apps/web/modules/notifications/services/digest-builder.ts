import { prisma } from "@/lib/db";

export type InboxDigest = {
  unreadNotificationCount: number;
  openActionCount: number;
  overdueActionCount: number;
  dueTodayActionCount: number;
};

/**
 * Grouped summary for future email/push digests — no external sending.
 */
export async function buildInboxDigest(userId: string): Promise<InboxDigest> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86400000);

  const [unreadNotificationCount, openActionCount, overdueActionCount, dueTodayActionCount] =
    await Promise.all([
      prisma.notification.count({
        where: { userId, status: "UNREAD" },
      }),
      prisma.actionQueueItem.count({
        where: { userId, status: { in: ["OPEN", "IN_PROGRESS"] } },
      }),
      prisma.actionQueueItem.count({
        where: {
          userId,
          status: { in: ["OPEN", "IN_PROGRESS"] },
          dueAt: { lt: now },
        },
      }),
      prisma.actionQueueItem.count({
        where: {
          userId,
          status: { in: ["OPEN", "IN_PROGRESS"] },
          dueAt: { gte: startOfDay, lt: endOfDay },
        },
      }),
    ]);

  return {
    unreadNotificationCount,
    openActionCount,
    overdueActionCount,
    dueTodayActionCount,
  };
}
