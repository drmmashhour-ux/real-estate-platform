import { prisma } from "@/lib/db";
import type { ListingRankingBreakdown } from "@/lib/marketplace-ranking/ranking.types";

export async function persistListingRankScoreRows(
  rows: Array<{ listingId: string; breakdown: ListingRankingBreakdown }>,
  rankingContextHash: string,
  listingType = "bnhub",
): Promise<void> {
  if (rows.length === 0) return;
  await prisma.listingRankScore.createMany({
    data: rows.map((r) => ({
      listingId: r.listingId.slice(0, 64),
      listingType: listingType.slice(0, 16),
      totalScore: r.breakdown.totalScore,
      breakdownJson: r.breakdown as unknown as object,
      rankingContextHash: rankingContextHash.slice(0, 64),
    })),
  });
}
