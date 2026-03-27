import { prisma } from "@/lib/db";

/** Public aggregate for homepage trust line. Returns null if DB unavailable or no rated rows. */
export async function getFeedbackRatingSummary(): Promise<{ average: number; count: number } | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    const whereRated = { rating: { not: null } } as const;
    const [agg, count] = await Promise.all([
      prisma.userFeedback.aggregate({
        _avg: { rating: true },
        where: whereRated,
      }),
      prisma.userFeedback.count({ where: whereRated }),
    ]);
    const avg = agg._avg.rating;
    if (count === 0 || avg == null) return null;
    return { average: Math.round(avg * 10) / 10, count };
  } catch {
    return null;
  }
}
