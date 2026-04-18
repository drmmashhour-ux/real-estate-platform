import { NextRequest } from "next/server";
import { searchListingsWithOptionalReputationRank } from "@/modules/ranking/search-ranking.service";
import { reputationEngineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

/**
 * Opt-in ranked BNHub search — same query surface as core search; when FEATURE_RANKING_ENGINE_V1 is on,
 * results are re-ordered by explainable BNHub bundle scores.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") ?? undefined;
    const checkIn = searchParams.get("checkIn") ?? undefined;
    const checkOut = searchParams.get("checkOut") ?? undefined;
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const guests = searchParams.get("guests");
    const sort = searchParams.get("sort") ?? "recommended";
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 40;

    const result = await searchListingsWithOptionalReputationRank({
      city,
      checkIn,
      checkOut,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      guests: guests ? Number(guests) : undefined,
      sort: sort === "priceAsc" || sort === "priceDesc" || sort === "recommended" || sort === "newest" ? sort : "recommended",
      limit: Number.isFinite(limit) ? limit : 40,
    });

    return Response.json({
      rankedBy: result.rankedBy,
      engineEnabled: reputationEngineFlags.rankingEngineV1,
      listings: result.listings,
      ...(reputationEngineFlags.rankingDebugV1 && result.scores ? { scores: result.scores } : {}),
    });
  } catch (e) {
    console.error("[api/ranking/listings]", e);
    return Response.json({ error: "Unable to load ranked listings" }, { status: 503 });
  }
}
