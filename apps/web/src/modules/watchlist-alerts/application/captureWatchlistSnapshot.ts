import { prisma } from "@/lib/db";
import {
  createWatchlistSnapshotRow,
  getLatestWatchlistSnapshotRow,
  toSnapshotState,
} from "@/src/modules/watchlist-alerts/infrastructure/watchlistSnapshotRepository";
import { compareWatchlistSnapshots } from "@/src/modules/watchlist-alerts/application/compareWatchlistSnapshots";
import { aggregateListingIntelligence } from "@/src/core/intelligence/aggregation/aggregationEngine";

function normalizeConfidence(n: number | null | undefined): number | null {
  if (n == null) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function captureWatchlistSnapshot(userId: string, listingId: string) {
  const [listing, analysis, previous] = await Promise.all([
    prisma.fsboListing.findUnique({
      where: { id: listingId },
      select: { id: true, trustScore: true, riskScore: true, priceCents: true, status: true, updatedAt: true },
    }),
    prisma.dealAnalysis.findFirst({
      where: { propertyId: listingId },
      orderBy: { createdAt: "desc" },
      select: { investmentScore: true, confidenceScore: true, recommendation: true },
    }),
    getLatestWatchlistSnapshotRow({ userId, listingId }),
  ]);

  const freshnessDays = listing ? Math.max(0, Math.floor((Date.now() - listing.updatedAt.getTime()) / 86_400_000)) : 7;
  const intelligence = aggregateListingIntelligence({
    cacheKey: `watchlist:snapshot:${userId}:${listingId}`,
    input: {
      priceCents: listing?.priceCents ?? 0,
      trustScore: listing?.trustScore ?? null,
      riskScore: listing?.riskScore ?? null,
      freshnessDays,
    },
  });

  const created = await createWatchlistSnapshotRow({
    userId,
    listingId,
    dealScore: analysis?.investmentScore ?? intelligence.scores.dealScore,
    trustScore: listing?.trustScore ?? intelligence.scores.trustScore,
    fraudScore: listing?.riskScore ?? intelligence.scores.riskScore,
    confidence: normalizeConfidence(analysis?.confidenceScore ?? intelligence.scores.confidenceScore),
    recommendation: analysis?.recommendation ?? intelligence.explanation.recommendedAction,
    price: listing?.priceCents ?? null,
    listingStatus: listing?.status ?? null,
  });

  const comparison = compareWatchlistSnapshots(previous ? toSnapshotState(previous) : null, toSnapshotState(created));

  return {
    snapshot: created,
    comparison,
  };
}
