import { NextRequest } from "next/server";
import { SearchService } from "@/lib/bnhub/services";
import { rankListings } from "@/lib/ai/bnhub-search";
import { cacheGet, cacheSet, isRedisConfigured } from "@/lib/cache/redis";
import { getActivePromotedListingIds } from "@/lib/promotions";
import { getGuestId } from "@/lib/auth/session";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { DemoEvents } from "@/lib/demo-event-types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const SEARCH_CACHE_TTL = 60; // seconds

/** Map API sort param to internal sort. */
function mapSort(sort: string | null): "newest" | "priceAsc" | "priceDesc" | "recommended" | "popular" {
  switch (sort) {
    case "price_asc":
      return "priceAsc";
    case "price_desc":
      return "priceDesc";
    case "newest":
      return "newest";
    case "most_viewed":
    case "popular":
      return "popular";
    case "ai_best_match":
      return "recommended";
    default:
      return "recommended";
  }
}

/**
 * GET /api/bnhub/search — Paginated search. Fast, scalable.
 * Query: location, checkIn, checkOut, guests, minPrice, maxPrice, propertyType, roomType,
 *        minBeds, minBaths, instantBook, verifiedOnly, sort, page, limit.
 * sort: price_asc | price_desc | ai_best_match
 * Returns: { data, total, page, limit, hasMore }
 */
export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("location") ?? searchParams.get("city") ?? undefined;
    const listingCode = searchParams.get("listingCode") ?? undefined;
    const checkIn = searchParams.get("checkIn") ?? undefined;
    const checkOut = searchParams.get("checkOut") ?? undefined;
    const guests = searchParams.get("guests");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const propertyType = searchParams.get("propertyType") ?? undefined;
    const roomType = searchParams.get("roomType") ?? undefined;
    const minBeds = searchParams.get("minBeds");
    const minBaths = searchParams.get("minBaths");
    const centerLat = searchParams.get("centerLat");
    const centerLng = searchParams.get("centerLng");
    const radiusKm = searchParams.get("radiusKm");
    const instantBook = searchParams.get("instantBook") === "true";
    const verifiedOnly =
      searchParams.get("verifiedOnly") === "true" || searchParams.get("verified_only") === "true";
    const sortParam = searchParams.get("sort");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
    );

    const sort = mapSort(sortParam);

    const cacheKey = isRedisConfigured()
      ? `bnhub:search:${[city, listingCode, checkIn, checkOut, guests, minPrice, maxPrice, propertyType, roomType, centerLat, centerLng, radiusKm, minBaths, instantBook, verifiedOnly, sort, page, limit].join(":")}`
      : null;
    if (cacheKey) {
      const cached = await cacheGet(cacheKey);
      if (cached) {
        try {
          return Response.json(JSON.parse(cached), {
            headers: {
              "Server-Timing": `bnhub-search;desc="total";dur=${Date.now() - startedAt}, cache;desc="redis-hit"`,
            },
          });
        } catch {
          // invalid cache, fall through
        }
      }
    }

    const latN = centerLat != null ? Number(centerLat) : NaN;
    const lngN = centerLng != null ? Number(centerLng) : NaN;
    const rKm = radiusKm != null ? Number(radiusKm) : NaN;

    const { listings, total, hasMore } = await SearchService.searchListingsPaginated({
      city,
      listingCode: listingCode ?? undefined,
      checkIn,
      checkOut,
      guests: guests ? Number(guests) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      propertyType,
      roomType,
      minBeds: minBeds ? Number(minBeds) : undefined,
      minBaths: minBaths ? Number(minBaths) : undefined,
      centerLat: Number.isFinite(latN) ? latN : undefined,
      centerLng: Number.isFinite(lngN) ? lngN : undefined,
      radiusKm: Number.isFinite(rKm) ? rKm : undefined,
      instantBook: instantBook || undefined,
      verifiedOnly,
      sort,
      page,
      limit,
    });

    const filters = {
      location: city,
      checkIn,
      checkOut,
      guests: guests ? Number(guests) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      propertyType,
    };

    const ranked = rankListings(listings, filters);

    const featuredIds = new Set(await getActivePromotedListingIds({ placement: "FEATURED", limit: 40 }));
    const NEW_DAYS = 14;
    const now = Date.now();
    const enriched = ranked.map((row) => {
      const created = row.createdAt != null ? new Date(row.createdAt as string | Date).getTime() : NaN;
      const ageDays = Number.isFinite(created) ? (now - created) / (86400 * 1000) : 999;
      return {
        ...row,
        _conversionBadges: {
          isNew: ageDays <= NEW_DAYS,
          isFeatured: featuredIds.has(String(row.id)),
          /** No price history in schema yet; reserved for future promotion hooks */
          priceDrop: false,
        },
      };
    });

    const payload = { data: enriched, total, page, limit, hasMore };
    if (cacheKey) {
      await cacheSet(cacheKey, JSON.stringify(payload), SEARCH_CACHE_TTL);
    }
    if (process.env.NEXT_PUBLIC_ENV === "staging") {
      const uid = await getGuestId().catch(() => null);
      void trackDemoEvent(
        DemoEvents.SEARCH,
        {
          query: city ?? listingCode ?? "",
          filters: {
            city,
            listingCode,
            minPrice,
            maxPrice,
            propertyType,
            sort: sortParam ?? undefined,
            page,
            limit,
          },
          resultsCount: total,
        },
        uid
      );
    }
    return Response.json(payload, {
      headers: {
        "Server-Timing": `bnhub-search;desc="total";dur=${Date.now() - startedAt}`,
      },
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
