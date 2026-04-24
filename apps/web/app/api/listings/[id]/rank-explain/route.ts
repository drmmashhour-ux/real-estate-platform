import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/db";
import { logRankingAudit } from "@/lib/marketplace-ranking/ranking-audit";
import {
  buildRankingContextPayload,
  rankListingsAlgorithm,
  type RankableListingInput,
} from "@/lib/marketplace-ranking/ranking-algorithm.engine";

export const dynamic = "force-dynamic";

/**
 * GET /api/listings/:id/rank-explain — single-listing breakdown for internal QA (broker/admin).
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("broker");
  if (!auth.ok) return auth.response;

  if (!engineFlags.listingMarketplaceRankAlgorithmV1) {
    return NextResponse.json({ ok: false, error: "feature_disabled" }, { status: 404 });
  }

  const { id: listingId } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city") ?? undefined;
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const propertyType = searchParams.get("propertyType") ?? undefined;
  const guests = searchParams.get("guests");

  const row = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    include: {
      _count: { select: { reviews: true, bookings: true } },
      reviews: { take: 8, select: { propertyRating: true } },
    },
  });

  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const listing: RankableListingInput = {
    id: row.id,
    title: row.title,
    listingCode: row.listingCode,
    city: row.city,
    region: row.region,
    nightPriceCents: row.nightPriceCents,
    maxGuests: row.maxGuests,
    beds: row.beds,
    baths: row.baths ?? undefined,
    propertyType: row.propertyType,
    roomType: row.roomType,
    photos: row.photos,
    description: row.description,
    amenities: row.amenities,
    listingStatus: String(row.listingStatus),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    verificationStatus: String(row.verificationStatus),
    _count: row._count,
    reviews: row.reviews,
  };

  const filters = {
    location: city,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    propertyType,
    guests: guests ? Number(guests) : undefined,
  };

  const rankingCtx = buildRankingContextPayload(filters, {
    userId: auth.user.id,
    searchQuery: searchParams.get("q") ?? null,
    marketSegment: "SHORT_TERM",
    sortIntent: "RELEVANCE",
  });

  const { ranked, contextHash, weightsPresetKey } = rankListingsAlgorithm(rankingCtx, [listing], {});

  void logRankingAudit({
    ownerId: auth.user.id,
    actorId: auth.user.id,
    listingId,
    actionType: "explanation_viewed",
    summary: "Listing rank explanation viewed",
    details: { listingId, contextHash },
  }).catch(() => null);

  return NextResponse.json({
    ok: true,
    contextHash,
    weightsPresetKey,
    breakdown: ranked[0]?.breakdown ?? null,
  });
}
