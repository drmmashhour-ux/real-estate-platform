import { prisma } from "@/lib/db";

/** Returns conditions with deadlines in the next `withinDays` days or already overdue. */
export async function getUpcomingDeadlines(dealId: string, withinDays = 30) {
  const now = new Date();
  const horizon = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
  return prisma.dealClosingCondition.findMany({
    where: {
      dealId,
      deadline: { not: null, lte: horizon },
      status: { not: "fulfilled" },
    },
    orderBy: { deadline: "asc" },
  });
}

export async function getOverdueConditions(dealId: string) {
  const now = new Date();
  return prisma.dealClosingCondition.findMany({
    where: {
      dealId,
      deadline: { lt: now },
      status: { not: "fulfilled" },
    },
  });
}
