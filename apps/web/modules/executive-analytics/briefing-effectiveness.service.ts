import { prisma } from "@/lib/db";

export async function avgHoursToReviewBriefing(userId: string): Promise<number | null> {
  const rows = await prisma.executiveBriefing.findMany({
    where: {
      createdByUserId: userId,
      reviewedAt: { not: null },
    },
    take: 40,
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, reviewedAt: true },
  });
  if (rows.length === 0) return null;
  const deltas = rows
    .map((r) => (r.reviewedAt ? (r.reviewedAt.getTime() - r.createdAt.getTime()) / 3600000 : null))
    .filter((n): n is number => n !== null);
  if (deltas.length === 0) return null;
  return deltas.reduce((a, b) => a + b, 0) / deltas.length;
}
