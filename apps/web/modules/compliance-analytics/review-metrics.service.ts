import { prisma } from "@/lib/db";

export async function getReviewThroughputMetrics(days: number) {
  const since = new Date(Date.now() - days * 86400000);
  const [created, completed] = await Promise.all([
    prisma.qaReview.count({ where: { createdAt: { gte: since } } }),
    prisma.qaReview.count({ where: { status: "completed", updatedAt: { gte: since } } }),
  ]);
  return { created, completed, windowDays: days };
}
