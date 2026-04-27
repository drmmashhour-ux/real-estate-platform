import {
  relevanceCacheKey,
  getCachedRelevance,
  setCachedRelevance,
  type SearchableListing,
  type RankedSearchListing,
} from "@/lib/ai/searchRelevance";
import { rankPersonalizedSearch } from "@/lib/ai/searchPersonalized";
import { getPreferences, recordSearchQueryPreference } from "@/lib/ai/preferences";
import { readOnlyQuery } from "@/lib/db";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";
import { getGuestId } from "@/lib/auth/session";
import { getUserProfile } from "@/lib/ai/userProfile";
import { flags } from "@/lib/flags";

export const dynamic = "force-dynamic";

const LIMIT = 200;

type Row = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  propertyType: string | null;
  rating: string | number | null;
  trustScore: string | number | null;
  bookingsLast30d: string | number | null;
  views: string | number | null;
  price: string | number | null;
  marketPrice: string | number | null;
};

function toNum(x: string | number | null | undefined): number | null {
  if (x == null || x === "") return null;
  const n = typeof x === "string" ? parseFloat(x) : x;
  if (n == null || !Number.isFinite(n)) return null;
  return n;
}

/**
 * GET /api/search/relevance?q=… — re-rank published BNHub stays (global relevance + per-user taste when signed in).
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const debugParam = searchParams.get("debug") === "1";
  const userId = await getGuestId();
  const cacheKey = relevanceCacheKey(q, LIMIT, userId, 6, debugParam);
  const hit = getCachedRelevance<RankedSearchListing[]>(cacheKey);
  if (hit) {
    return Response.json({
      q,
      cap: LIMIT,
      items: hit,
      cached: true,
      meta: { personalized: Boolean(userId), prefCount: null, tookMs: 0 },
    });
  }

  if (userId && q.trim().length >= 2) {
    void recordSearchQueryPreference(userId, q).catch(() => {});
  }

  const profile = flags.RECOMMENDATIONS && userId ? await getUserProfile(userId) : null;

  const raw = await readOnlyQuery<Row>(
    `/* search:relevance */
     SELECT
       l."id",
       l."title",
       l."description",
       l."city",
       l."propertyType" AS "propertyType",
       l."bnhub_listing_rating_average" AS "rating",
       COALESCE(lqs."trust_score", l."ai_discovery_score", 0) AS "trustScore",
       l."bnhub_listing_view_count" AS "views",
       (l."nightPriceCents"::float / 100.0) AS "price",
       (
         SELECT COUNT(*)::int
         FROM "Booking" b
         WHERE b."listingId" = l."id"
           AND b."status" IN ('CONFIRMED', 'COMPLETED', 'DISPUTED')
           AND b."createdAt" >= NOW() - INTERVAL '30 days'
       ) AS "bookingsLast30d",
       (
         SELECT (AVG(x."nightPriceCents"::float) / 100.0)
         FROM "bnhub_listings" x
         WHERE x."city" = l."city"
           AND x."listingStatus" = 'PUBLISHED'
           AND x."id" <> l."id"
       ) AS "marketPrice"
     FROM "bnhub_listings" l
     LEFT JOIN "listing_quality_scores" lqs ON lqs."listing_id" = l."id"
     WHERE l."listingStatus" = 'PUBLISHED'
     LIMIT $1`,
    [LIMIT]
  );

  const listings: Array<SearchableListing & { id: string }> = raw.map((r) => {
    const rating =
      r.rating == null || r.rating === "" ? null : typeof r.rating === "string" ? parseFloat(r.rating) : r.rating;
    const trustScore =
      r.trustScore == null || r.trustScore === ""
        ? null
        : typeof r.trustScore === "string"
          ? parseFloat(r.trustScore)
          : r.trustScore;
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      city: r.city,
      propertyType: r.propertyType,
      rating: rating != null && Number.isFinite(rating) ? rating : null,
      trustScore: trustScore != null && Number.isFinite(trustScore) ? trustScore : null,
      bookingsLast30d: toNum(r.bookingsLast30d) ?? 0,
      views: toNum(r.views) ?? 0,
      price: toNum(r.price),
      marketPrice: toNum(r.marketPrice),
    };
  });

  const { items, meta } = await rankPersonalizedSearch(q, listings, userId, getPreferences, {
    profile,
    debug: debugParam,
  });
  setCachedRelevance(cacheKey, items);
  return Response.json({
    q,
    cap: LIMIT,
    items,
    cached: false,
    meta: {
      personalized: meta.personalized,
      prefCount: meta.prefCount,
      tookMs: meta.tookMs,
    },
  });
}
