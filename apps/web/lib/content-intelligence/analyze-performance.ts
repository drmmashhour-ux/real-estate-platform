import { prisma } from "@/lib/db";
import { computeContentPerformanceScore, legacyScoreFromRow } from "./scoring";

/**
 * Recompute and persist `performanceScore` for all machine-generated rows.
 * Call after metrics sync or periodically.
 */
export async function refreshAllMachineContentPerformanceScores(opts?: {
  batchSize?: number;
}): Promise<{ updated: number }> {
  const batchSize = opts?.batchSize ?? 200;
  let updated = 0;
  let skip = 0;
  for (;;) {
    const batch = await prisma.machineGeneratedContent.findMany({
      take: batchSize,
      skip,
      orderBy: { id: "asc" },
      select: {
        id: true,
        views: true,
        clicks: true,
        conversions: true,
        saves: true,
        shares: true,
        bookings: true,
        revenueCents: true,
      },
    });
    if (batch.length === 0) break;

    for (const row of batch) {
      const score = legacyScoreFromRow(row);
      await prisma.machineGeneratedContent.update({
        where: { id: row.id },
        data: { performanceScore: score },
      });
      updated += 1;
    }

    skip += batch.length;
    if (batch.length < batchSize) break;
  }

  return { updated };
}

/** Update a single row score (e.g. after webhook). */
export async function refreshMachineContentScoreById(id: string): Promise<number | null> {
  const row = await prisma.machineGeneratedContent.findUnique({
    where: { id },
    select: {
      views: true,
      clicks: true,
      conversions: true,
      saves: true,
      shares: true,
      bookings: true,
      revenueCents: true,
    },
  });
  if (!row) return null;
  const score = computeContentPerformanceScore({
    views: row.views,
    clicks: row.clicks,
    saves: row.saves,
    shares: row.shares,
    conversions: row.conversions,
    bookings: row.bookings,
    revenueCents: row.revenueCents,
  });
  await prisma.machineGeneratedContent.update({
    where: { id },
    data: { performanceScore: score },
  });
  return score;
}
