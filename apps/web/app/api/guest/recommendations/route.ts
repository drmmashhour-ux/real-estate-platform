import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { searchListings } from "@/lib/bnhub/listings";
import { getGuestId } from "@/lib/auth/session";
import {
  buildGuestContextForStaysSearch,
  getRecommendedListings,
  loadGuestBehaviorSignals,
  mergeGuestScoresIntoListings,
  parseGuestPreferenceTags,
} from "@/modules/guest-ai";
import { DEFAULT_STAYS_FILTERS, type GlobalSearchFiltersExtended } from "@/components/search/FilterState";

export const dynamic = "force-dynamic";

const MAX_LIMIT = 48;

/**
 * GET /api/guest/recommendations — curated BNHub stays for the signed-in or anonymous guest.
 * Scores are transparent; badges are computed from cohort stats, never fabricated urgency.
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const location = (sp.get("city") ?? sp.get("location") ?? "").trim();
    const checkIn = sp.get("checkIn")?.trim() || "";
    const checkOut = sp.get("checkOut")?.trim() || "";
    const guestsRaw = sp.get("guests");
    const guests = guestsRaw ? Math.max(1, parseInt(guestsRaw, 10) || 1) : null;
    const priceMin = sp.get("priceMin") ? Math.max(0, parseInt(sp.get("priceMin")!, 10) || 0) : 0;
    const priceMax = sp.get("priceMax") ? Math.max(0, parseInt(sp.get("priceMax")!, 10) || 0) : 0;
    const limitRaw = sp.get("limit");
    const limit = Math.min(MAX_LIMIT, Math.max(1, limitRaw ? parseInt(limitRaw, 10) || 24 : 24));
    const sort =
      sp.get("sort") === "priceAsc" ||
      sp.get("sort") === "priceDesc" ||
      sp.get("sort") === "recommended" ||
      sp.get("sort") === "ai" ||
      sp.get("sort") === "newest"
        ? sp.get("sort")!
        : "recommended";

    const preferences = parseGuestPreferenceTags(sp.get("preferences"));

    const userId = await getGuestId();
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("lecipm_behavior_sid")?.value ?? null;

    const behaviorSignals = await loadGuestBehaviorSignals({ userId, sessionId });

    const filters: GlobalSearchFiltersExtended = {
      ...DEFAULT_STAYS_FILTERS,
      location,
      checkIn,
      checkOut,
      guests,
      priceMin,
      priceMax,
      sort,
    };

    const guestContext = buildGuestContextForStaysSearch({
      filters,
      behaviorSignals,
      preferenceTags: preferences.length ? preferences : undefined,
    });

    const listings = await searchListings({
      city: location || undefined,
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      guests: guests ?? undefined,
      minPrice: priceMin > 0 ? priceMin : undefined,
      maxPrice: priceMax > 0 ? priceMax : undefined,
      sort,
      limit,
      userId,
      sessionId,
    });

    const rec = getRecommendedListings(guestContext, listings);
    const rankedListings = mergeGuestScoresIntoListings(listings, rec, { reorder: true });

    return Response.json({
      listings: rankedListings,
      meta: {
        engine: "modules/guest-ai/recommendation.engine",
        count: rankedListings.length,
        personalization: {
          behaviorLoaded: Boolean(userId || sessionId),
          preferenceTags: preferences,
        },
      },
    });
  } catch (e) {
    console.error("[guest/recommendations]", e);
    return Response.json({ error: "recommendations_failed" }, { status: 500 });
  }
}
