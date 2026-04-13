import type { ListingLearningStats, BehaviorPreferenceProfile, ShortTermListing } from "@prisma/client";
import { prisma } from "@/lib/db";
import { computeBehaviorLearningScore } from "@/lib/learning/computeBehaviorLearningScore";
import { computeListingContextMatch, preferenceVectorFromProfile } from "@/lib/learning/contextPreference";
import { extractListingLearningFeatures } from "@/lib/learning/extractListingLearningFeatures";
import { getRankingExplanation } from "@/lib/learning/explanations";

export type BnhubListingWithLearning<T> = T & {
  learningRankScore?: number;
  learningExplanation?: string;
  learningExplanationDetail?: string;
};

function isLearningSort(sort?: string | null): boolean {
  return sort === "recommended" || sort === "ai" || sort === "aiScore";
}

/**
 * Re-ranks BNHUB search rows using cached learning stats + optional preference profile.
 * No-op when env disabled or non-AI sort — preserves all existing flows.
 */
export async function applyBehaviorLearningToBnhubSearchResults<
  T extends {
    id: string;
    aiScore?: number;
    city: string;
    region?: string | null;
    country: string;
    propertyType?: string | null;
    roomType?: string | null;
    nightPriceCents: number;
    bedrooms?: number | null;
    beds: number;
    baths: number;
    maxGuests: number;
    amenities?: unknown;
    petsAllowed?: boolean;
    createdAt: Date;
    verificationStatus: string;
  },
>(
  listings: T[],
  ctx: {
    sort?: string | null;
    userId?: string | null;
    sessionId?: string | null;
    city?: string | null;
  }
): Promise<BnhubListingWithLearning<T>[]> {
  if (listings.length === 0) return [];

  const enabled = process.env.BEHAVIOR_LEARNING_RANK_ENABLED === "1";
  if (!enabled || !isLearningSort(ctx.sort)) {
    return listings as BnhubListingWithLearning<T>[];
  }

  const ids = listings.map((l) => l.id);
  const [statsRows, profileUser, profileSession] = await Promise.all([
    prisma.listingLearningStats.findMany({ where: { listingId: { in: ids } } }),
    ctx.userId
      ? prisma.behaviorPreferenceProfile.findUnique({ where: { userId: ctx.userId } })
      : Promise.resolve(null),
    ctx.sessionId
      ? prisma.behaviorPreferenceProfile.findUnique({ where: { sessionId: ctx.sessionId } })
      : Promise.resolve(null),
  ]);

  const statsById = new Map(statsRows.map((s) => [s.listingId, s] as const));
  const profile: BehaviorPreferenceProfile | null = profileUser ?? profileSession ?? null;

  const enriched = listings.map((listing) => {
    const stats: ListingLearningStats | null = statsById.get(listing.id) ?? null;
    const baseRankingScore = (listing.aiScore ?? 72) / 100;
    const features = extractListingLearningFeatures(listing as unknown as ShortTermListing);
    const prefs = preferenceVectorFromProfile(profile);
    const contextMatch = computeListingContextMatch(features, prefs, ctx.city);
    const learningRankScore = computeBehaviorLearningScore({
      baseRankingScore,
      features,
      stats,
      profile,
      searchCity: ctx.city,
    });
    const { label, detail } = getRankingExplanation({
      features,
      stats,
      contextMatch,
      searchCity: ctx.city,
    });
    return {
      ...listing,
      learningRankScore,
      learningExplanation: label,
      learningExplanationDetail: detail,
    };
  });

  const sorted = [...enriched].sort((a, b) => {
    const x = b.learningRankScore ?? 0;
    const y = a.learningRankScore ?? 0;
    if (Math.abs(x - y) > 1e-9) return x - y;
    return String(a.id).localeCompare(String(b.id));
  });

  return sorted as BnhubListingWithLearning<T>[];
}
