import type { PrismaClient } from "@prisma/client";

export async function getCrmSuggestionQuality(db: PrismaClient, days = 30) {
  const since = new Date(Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1000);
  const events = await db.aiFeedbackEvent.findMany({
    where: {
      subsystem: "crm",
      createdAt: { gte: since },
    },
    select: { accepted: true, rating: true },
  });
  const total = events.length;
  const accepted = events.filter((e) => e.accepted === true).length;
  const rated = events.filter((e) => typeof e.rating === "number");
  const avgRating = rated.length ? rated.reduce((a, b) => a + (b.rating ?? 0), 0) / rated.length : null;
  return {
    days,
    totalFeedback: total,
    acceptedRate: total ? accepted / total : 0,
    avgRating,
  };
}
