import type { PrismaClient } from "@prisma/client";

export async function getSeoPerformanceFeedback(db: PrismaClient, days = 30) {
  const since = new Date(Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1000);
  const feedback = await db.aiFeedbackEvent.findMany({
    where: { subsystem: "seo", createdAt: { gte: since } },
    select: { accepted: true, rating: true },
  });
  const total = feedback.length;
  const accepted = feedback.filter((f) => f.accepted === true).length;
  return {
    days,
    totalFeedback: total,
    acceptedRate: total ? accepted / total : 0,
    avgRating:
      feedback.filter((f) => typeof f.rating === "number").reduce((a, b, _, arr) => a + (b.rating ?? 0) / arr.length, 0) ||
      null,
  };
}
