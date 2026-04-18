/**
 * LECIPM Reputation + Ranking Engine v1 — facade over existing BNHub `computeBnhubRankingBundle`
 * plus unified explainability. Does not replace core search ordering unless the opt-in API is used.
 */
import { prisma } from "@/lib/db";
import { computeBnhubRankingBundle } from "@/modules/bnhub-ranking/ranking-engine.service";
import { buildRankingFeatureVector } from "@/modules/bnhub-ranking/ranking-features.service";
import { buildUnifiedRankingExplanation, type UnifiedRankingExplanation } from "./ranking-factors.service";

export type { UnifiedRankingExplanation } from "./ranking-factors.service";

export async function computeReputationRankingForListing(listingId: string): Promise<UnifiedRankingExplanation | null> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!listing) return null;

  const [bundle, features] = await Promise.all([
    computeBnhubRankingBundle(listingId),
    buildRankingFeatureVector(listingId),
  ]);

  return buildUnifiedRankingExplanation(listingId, listing.ownerId, bundle, {
    recencyDays: features?.recencyDays,
    priceVsPeerRatio: features?.priceVsPeerRatio,
  });
}
