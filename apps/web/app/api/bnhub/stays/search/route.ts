import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { SearchEventType } from "@prisma/client";
import { searchListings } from "@/lib/bnhub/listings";
import { hasValidMapBounds, parseGlobalSearchBody } from "@/components/search/FilterState";
import { parseStaysFiltersFromBody } from "@/lib/bnhub/parse-stays-search-body";
import { hasActiveStaysFilters } from "@/lib/bnhub/stays-filters";
import { getGuestId } from "@/lib/auth/session";
import { trackSearchEvent } from "@/lib/ai/search/trackSearchEvent";

export const dynamic = "force-dynamic";

/**
 * POST — global search payload for short-term (BNHUB) stays.
 * Body matches `GlobalSearchFilters` with `type: "short"`.
 */
export async function POST(request: NextRequest) {
  try {
    const raw = await request.json().catch(() => ({}));
    const f = parseGlobalSearchBody(raw);
    if (f.type !== "short") {
      return Response.json({ error: "type must be \"short\" for this endpoint" }, { status: 400 });
    }
    const staysRaw =
      raw && typeof raw === "object" && "staysFilters" in (raw as object)
        ? (raw as { staysFilters?: unknown }).staysFilters
        : undefined;
    const staysFilters = parseStaysFiltersFromBody(staysRaw);

    const amenitySlugs = f.features.filter((x) =>
      ["wifi", "kitchen", "ac", "parking", "washer", "pet_friendly"].includes(x)
    );
    const discoveryFeatures = f.features.filter((x) =>
      ["waterfront", "hot_tub", "self_checkin"].includes(x)
    );
    const bbox = hasValidMapBounds(f)
      ? { north: f.north!, south: f.south!, east: f.east!, west: f.west! }
      : {};

    const userId = await getGuestId();
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("lecipm_behavior_sid")?.value ?? null;
    const listings = await searchListings({
      city: f.location.trim() || undefined,
      checkIn: f.checkIn?.trim() || undefined,
      checkOut: f.checkOut?.trim() || undefined,
      minPrice: f.priceMin > 0 ? f.priceMin : undefined,
      maxPrice: f.priceMax > 0 ? f.priceMax : undefined,
      guests: f.guests != null && f.guests > 0 ? f.guests : undefined,
      verifiedOnly: f.features.includes("verified"),
      propertyType: f.propertyType?.trim() || undefined,
      roomType: f.roomType?.trim() || undefined,
      instantBook: f.features.includes("instant_book") || undefined,
      minBeds: f.bedrooms != null && f.bedrooms >= 0 ? f.bedrooms : undefined,
      minBaths: f.bathrooms != null && f.bathrooms >= 0 ? f.bathrooms : undefined,
      amenitySlugs: amenitySlugs.length ? amenitySlugs : undefined,
      discoveryFeatures: discoveryFeatures.length ? discoveryFeatures : undefined,
      staysFilters: hasActiveStaysFilters(staysFilters ?? undefined) ? staysFilters : null,
      ...bbox,
      sort:
        f.sort === "priceAsc" ||
        f.sort === "priceDesc" ||
        f.sort === "recommended" ||
        f.sort === "ai" ||
        f.sort === "aiScore" ||
        f.sort === "best_value" ||
        f.sort === "top_conversion" ||
        f.sort === "ranking"
          ? f.sort
          : "newest",
      userId,
      sessionId,
    });

    void trackSearchEvent({
      eventType: SearchEventType.SEARCH,
      userId,
      metadata: {
        city: f.location.trim() || undefined,
        sort: f.sort,
        checkIn: f.checkIn,
        checkOut: f.checkOut,
      },
    });

    return Response.json({ data: listings, filters: f });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Stays search failed" }, { status: 500 });
  }
}
