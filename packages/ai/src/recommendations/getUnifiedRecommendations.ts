import { AiDecisionDomain, BookingStatus, ListingStatus, VerificationStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { attachReviewAggregatesForSearch } from "@/lib/bnhub/listings";
import { buildListingSignalsBatch } from "@/lib/ai/core/buildListingSignals";
import { buildUserSignals } from "@/lib/ai/core/buildUserSignals";
import { computeCompositeScore } from "@/lib/ai/intelligence/computeCompositeScore";
import { logIntelligenceDecision } from "@/lib/ai/intelligence/logIntelligenceDecision";

const BASE_INCLUDE = {
  owner: {
    select: { id: true, name: true, hostQuality: true },
  },
  _count: { select: { reviews: true, bookings: true } },
} as const;

/**
 * Unified recommendations using shared signals + composite scoring (recommendation domain).
 */
export async function getUnifiedRecommendations(userId: string, limit = 12) {
  const userSignals = await buildUserSignals(userId);
  if (!userSignals) return [];

  const [favs, bookedRows] = await Promise.all([
    prisma.bnhubGuestFavorite.findMany({
      where: { guestUserId: userId },
      select: { listingId: true },
    }),
    prisma.booking.findMany({
      where: {
        guestId: userId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING, BookingStatus.AWAITING_HOST_APPROVAL] },
      },
      select: { listingId: true },
    }),
  ]);

  const exclude = new Set([...favs.map((f) => f.listingId), ...bookedRows.map((b) => b.listingId)]);

  const profile = await prisma.userSearchProfile.findUnique({ where: { userId } });

  const baseWhere: Prisma.ShortTermListingWhereInput = {
    listingStatus: ListingStatus.PUBLISHED,
    verificationStatus: VerificationStatus.VERIFIED,
  };
  if (exclude.size > 0) baseWhere.id = { notIn: [...exclude] };

  const cities = profile?.preferredCities?.filter(Boolean) ?? [];
  const where: Prisma.ShortTermListingWhereInput =
    cities.length > 0
      ? {
          ...baseWhere,
          OR: cities.map((c) => ({
            city: { contains: c, mode: "insensitive" as const },
          })),
        }
      : baseWhere;

  const rows = await prisma.shortTermListing.findMany({
    where,
    include: BASE_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: Math.max(limit * 6, 48),
  });

  const candidates = await attachReviewAggregatesForSearch(rows);
  if (candidates.length === 0) return [];

  const signalsMap = await buildListingSignalsBatch(candidates.map((c) => c.id));

  const cityHint = profile?.preferredCities?.[0]?.trim();
  const scored = candidates
    .map((c) => {
      const sig = signalsMap.get(c.id);
      if (!sig) return null;
      const comp = computeCompositeScore({
        domain: "recommendation",
        listing: sig,
        userSignals,
        searchContext: {
          filters: {
            city: cityHint,
            minPrice: profile?.preferredPriceMin ?? undefined,
            maxPrice: profile?.preferredPriceMax ?? undefined,
            guests: profile?.preferredGuests ?? undefined,
            propertyType: profile?.preferredTypes?.[0] ?? undefined,
          },
        },
      });
      return { listing: c, score: comp.aiCompositeScore, composite: comp };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  scored.sort((a, b) => b.score - a.score);

  void logIntelligenceDecision({
    domain: AiDecisionDomain.RECOMMENDATIONS,
    actionType: "unified_recommendations",
    userId,
    explanation: `Returned ${Math.min(limit, scored.length)} recommendations`,
    confidenceScore: 0.8,
    outputPayload: { count: Math.min(limit, scored.length) },
  }).catch(() => {});

  return scored.slice(0, limit).map(({ listing, composite }) => {
    const { scores } = composite;
    return {
      ...listing,
      aiScore: composite.aiCompositeScore,
      aiBreakdown: {
        relevance: scores.relevanceScore,
        performance: scores.conversionScore,
        demand: scores.demandScore,
        price: scores.priceCompetitiveness,
        personalization: scores.personalizationScore,
        recency: scores.recencyScore,
      },
      aiLabels: [] as string[],
      intelligence: scores,
    };
  });
}
