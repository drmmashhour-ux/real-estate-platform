import { ListingAnalyticsKind, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { RANKING_LISTING_TYPE_REAL_ESTATE } from "@/src/modules/ranking/dataMap";
import type { RankingSearchContext } from "@/src/modules/ranking/types";
import type { FsboListingRankingInput } from "@/src/modules/ranking/types";
import { computeFsboRankingV2 } from "./ranking.service";

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

/**
 * Parallel to `scoreRealEstateListingsForBrowse` — uses Ranking v2 blend when flag enabled.
 */
export async function scoreRealEstateListingsForBrowseV2(
  ids: string[],
  ctx: Pick<RankingSearchContext, "city" | "propertyType" | "budgetMinCents" | "budgetMaxCents">
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;

  const rows = await prisma.fsboListing.findMany({
    where: { id: { in: ids } },
    include: {
      verification: true,
      _count: { select: { buyerListingViews: true, buyerSavedListings: true, leads: true } },
    },
  });
  const demandRows = await prisma.listingAnalytics.findMany({
    where: { kind: ListingAnalyticsKind.FSBO, listingId: { in: ids } },
    select: { listingId: true, demandScore: true },
  });
  const demandMap = new Map(demandRows.map((r) => [r.listingId, r.demandScore]));
  const med = median(rows.map((r) => r.priceCents));

  const fullCtx: RankingSearchContext = {
    listingType: RANKING_LISTING_TYPE_REAL_ESTATE,
    city: ctx.city,
    propertyType: ctx.propertyType,
    budgetMinCents: ctx.budgetMinCents,
    budgetMaxCents: ctx.budgetMaxCents,
  };

  for (const row of rows) {
    const ver = row.verification;
    const allVerified =
      ver &&
      ver.identityStatus === VerificationStatus.VERIFIED &&
      ver.addressStatus === VerificationStatus.VERIFIED &&
      ver.cadasterStatus === VerificationStatus.VERIFIED;
    const input: FsboListingRankingInput = {
      id: row.id,
      city: row.city,
      priceCents: row.priceCents,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      images: Array.isArray(row.images) ? row.images : [],
      description: row.description,
      propertyType: row.propertyType,
      status: row.status,
      moderationStatus: row.moderationStatus,
      trustScore: row.trustScore,
      riskScore: row.riskScore,
      verificationStatus: allVerified ? "VERIFIED" : ver ? "PENDING" : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      featuredUntil: row.featuredUntil,
      viewCount: row._count.buyerListingViews,
      saveCount: row._count.buyerSavedListings,
      leadCount: row._count.leads,
      demandScoreFromAnalytics: demandMap.get(row.id) ?? 0,
      medianPriceCents: med,
    };
    const { score0to100 } = computeFsboRankingV2(input, fullCtx, row.featuredUntil);
    map.set(row.id, score0to100);
  }
  return map;
}
