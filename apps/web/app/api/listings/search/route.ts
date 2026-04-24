import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActivePromotedListingIds } from "@/lib/promotions";
import { getGuestId } from "@/lib/auth/session";
import { searchListingsPaginated } from "@/lib/bnhub/listings";
import { intelligenceFlags } from "@/config/feature-flags";
import { getMemorySignalsForEngine } from "@/lib/marketplace-memory/memory-query.service";
import { buildMemoryRankHintFromSignals } from "@/lib/marketplace-memory/memory-ranking-hint";
import {
  logListingSearchRankingTelemetry,
  mapListingRowToRankable,
  rankListings,
} from "@/modules/search/ranking.engine";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  city: z.string().optional(),
  countryCode: z.string().optional(),
  marketCountryId: z.string().optional(),
  marketCityId: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.number().optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  amenities: z.array(z.string()).optional(),
  propertyType: z.string().optional(),
  sort: z.string().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  rankingDebug: z.boolean().optional(),
  /** Optional 0–1 affinity per listing id — bounded in engine; for signed-in experiments only. */
  guestAiAffinity: z.record(z.string(), z.number()).optional(),
});

function sortKeyFromClient(raw: string | undefined): string {
  const sortMap: Record<string, string> = {
    ai: "ai",
    recommended: "recommended",
    price_low: "priceAsc",
    price_high: "priceDesc",
    newest: "newest",
  };
  return sortMap[raw ?? "ai"] ?? "ai";
}

async function maybeApplyMarketplaceRanking(
  request: NextRequest,
  listings: Awaited<ReturnType<typeof searchListingsPaginated>>["listings"],
  args: {
    sort: string;
    city?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    priceMin?: number;
    priceMax?: number;
    propertyType?: string;
    rankingDebug: boolean;
    guestAiAffinity?: Record<string, number>;
  }
) {
  if (process.env.BNHUB_LISTINGS_SEARCH_MODULE_RANK === "false") {
    return listings;
  }
  if (args.sort !== "ai" && args.sort !== "recommended") {
    return listings;
  }
  if (listings.length <= 1) return listings;

  const rankable = listings.map((row) => mapListingRowToRankable(row));
  const userId = await getGuestId().catch(() => null);
  let memoryHint = null;
  if (userId && intelligenceFlags.marketplaceMemoryEngineV1) {
    const sessionId = request.cookies.get("lecipm_behavior_sid")?.value ?? null;
    const signals = await getMemorySignalsForEngine(userId, sessionId);
    memoryHint = buildMemoryRankHintFromSignals(signals);
  }

  const featured = new Set(await getActivePromotedListingIds({ placement: "FEATURED", limit: 40 }));
  const experiment =
    request.headers.get("x-bnhub-ranking-experiment")?.trim() ||
    request.headers.get("x-ranking-experiment")?.trim() ||
    undefined;

  let guestAiListingAffinity: Map<string, number> | null = null;
  if (args.guestAiAffinity && userId) {
    guestAiListingAffinity = new Map(
      Object.entries(args.guestAiAffinity).map(([id, v]) => [id, Math.max(0, Math.min(1, v))])
    );
  }

  const { listings: ranked, weightsPresetKey, contextHash } = rankListings(rankable, {
    userId,
    city: args.city ?? null,
    checkIn: args.checkIn ?? null,
    checkOut: args.checkOut ?? null,
    guests: args.guests ?? null,
    priceMin: args.priceMin ?? null,
    priceMax: args.priceMax ?? null,
    propertyType: args.propertyType ?? null,
    searchQuery: args.city ?? null,
    experimentCohort: experiment ?? null,
    memoryHint,
    promotedListingIds: featured,
    guestAiListingAffinity,
    sortIntent: "RELEVANCE",
  }, { attachExplainBreakdown: args.rankingDebug });

  logListingSearchRankingTelemetry(
    ranked.map((l) => ({
      listingId: l.id,
      ranking_position: l._rankingPosition,
      listing_score: l._listingScore,
    })),
    { weightsPresetKey, contextHash, source: "/api/listings/search" }
  );

  if (!args.rankingDebug) {
    return ranked.map(({ _rankingPosition, _listingScore, _rankingBreakdown, _factorBreakdown, ...rest }) => rest) as typeof listings;
  }
  return ranked as typeof listings;
}

function parseSearchParams(sp: URLSearchParams) {
  const guestsRaw = sp.get("guests");
  const pageRaw = sp.get("page");
  const limitRaw = sp.get("limit");
  const priceMinRaw = sp.get("priceMin");
  const priceMaxRaw = sp.get("priceMax");
  return {
    city: sp.get("city") ?? undefined,
    countryCode: sp.get("countryCode") ?? sp.get("country") ?? undefined,
    marketCountryId: sp.get("marketCountryId") ?? undefined,
    marketCityId: sp.get("marketCityId") ?? undefined,
    checkIn: sp.get("checkIn") ?? undefined,
    checkOut: sp.get("checkOut") ?? undefined,
    guests: Number.isFinite(guestsN) ? guestsN : undefined,
    priceMin: Number.isFinite(priceMinN) ? priceMinN : undefined,
    priceMax: Number.isFinite(priceMaxN) ? priceMaxN : undefined,
    propertyType: sp.get("propertyType") ?? undefined,
    amenities: sp.get("amenities")?.split(",").filter(Boolean),
    sort: sp.get("sort") ?? undefined,
    page: Number.isFinite(pageN) ? pageN : undefined,
    limit: Number.isFinite(limitN) ? limitN : undefined,
    rankingDebug: sp.get("rankingDebug") === "1" || sp.get("rankingDebug") === "true",
  };
}

async function handleSearch(request: NextRequest, body?: z.infer<typeof bodySchema>) {
  const rankingDebug =
    request.nextUrl.searchParams.get("rankingDebug") === "1" ||
    request.nextUrl.searchParams.get("rankingDebug") === "true" ||
    body?.rankingDebug === true;

  const b = body ?? {};
  const sort = sortKeyFromClient(typeof b.sort === "string" ? b.sort : undefined);

  const result = await searchListingsPaginated({
    city: b.city?.trim() || undefined,
    countryCode: b.countryCode?.trim() || undefined,
    marketCountryId: b.marketCountryId?.trim() || undefined,
    marketCityId: b.marketCityId?.trim() || undefined,
    checkIn: b.checkIn?.trim() || undefined,
    checkOut: b.checkOut?.trim() || undefined,
    guests: typeof b.guests === "number" && b.guests > 0 ? b.guests : undefined,
    minPrice: typeof b.priceMin === "number" && b.priceMin > 0 ? b.priceMin : undefined,
    maxPrice: typeof b.priceMax === "number" && b.priceMax > 0 ? b.priceMax : undefined,
    propertyType: b.propertyType?.trim() || undefined,
    amenitySlugs: Array.isArray(b.amenities) && b.amenities.length ? b.amenities : undefined,
    sort,
    page: b.page ?? 1,
    limit: b.limit ?? 24,
    userId: null,
  });

  const listings = await maybeApplyMarketplaceRanking(request, result.listings, {
    sort,
    city: b.city?.trim(),
    checkIn: b.checkIn?.trim(),
    checkOut: b.checkOut?.trim(),
    guests: typeof b.guests === "number" ? b.guests : undefined,
    priceMin: typeof b.priceMin === "number" ? b.priceMin : undefined,
    priceMax: typeof b.priceMax === "number" ? b.priceMax : undefined,
    propertyType: b.propertyType?.trim(),
    rankingDebug,
    guestAiAffinity: b.guestAiAffinity,
  });

  return NextResponse.json({
    listings,
    total: result.total,
    page: result.page,
    limit: result.limit,
    hasMore: result.hasMore,
    rankingMeta: {
      engine: "modules/search/ranking.engine",
      sort,
    },
  });
}

/**
 * POST /api/listings/search — BNHub published stays; `sort` ai/recommended uses explainable marketplace ranker.
 */
export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
    }
    return handleSearch(request, parsed.data);
  } catch (e) {
    console.error("[listings/search]", e);
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }
}

/**
 * GET /api/listings/search — query-param variant of POST (same ranking integration).
 */
export async function GET(request: NextRequest) {
  try {
    const q = parseSearchParams(request.nextUrl.searchParams);
    return handleSearch(request, {
      city: q.city,
      countryCode: q.countryCode,
      marketCountryId: q.marketCountryId,
      marketCityId: q.marketCityId,
      checkIn: q.checkIn,
      checkOut: q.checkOut,
      guests: Number.isFinite(q.guests) ? q.guests : undefined,
      priceMin: Number.isFinite(q.priceMin) ? q.priceMin : undefined,
      priceMax: Number.isFinite(q.priceMax) ? q.priceMax : undefined,
      amenities: q.amenities,
      propertyType: q.propertyType,
      sort: q.sort,
      page: Number.isFinite(q.page) ? q.page : undefined,
      limit: Number.isFinite(q.limit) ? q.limit : undefined,
    });
  } catch (e) {
    console.error("[listings/search GET]", e);
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }
}
