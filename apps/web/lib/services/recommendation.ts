import { query } from "@/lib/sql";
import { getPreferences, type UserPrefRow } from "@/lib/ai/preferences";
import { applyPersonalization } from "@/lib/ai/searchPersonalized";
import type { SearchableListing } from "@/lib/ai/searchRelevance";
import {
  computeSimilarity,
  demandBoost,
  type SimilarListingInput,
} from "@/lib/ai/similarity";

const CANDIDATE_LIMIT = 100;
const DEFAULT_TOP = 10;

type CandidateRow = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  propertyType: string | null;
  nightPrice: string | number | null;
  rating: string | number | null;
  bookingsLast30d: string | number | null;
  views: string | number | null;
  marketPrice: string | number | null;
  listingCode: string | null;
};

function toNum(x: string | number | null | undefined): number | null {
  if (x == null || x === "") return null;
  const n = typeof x === "string" ? parseFloat(x) : x;
  if (n == null || !Number.isFinite(n)) return null;
  return n;
}

/**
 * Pooled published stays (excluding the anchor) with demand and peer-price context.
 */
export async function getCandidates(listingId: string) {
  return query<CandidateRow>(
    `SELECT
       l."id",
       l."title",
       l."description",
       l."city",
       l."propertyType" AS "propertyType",
       (l."nightPriceCents"::float / 100.0) AS "nightPrice",
       l."bnhub_listing_rating_average" AS "rating",
       l."bnhub_listing_view_count" AS "views",
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
       ) AS "marketPrice",
       l."listing_code" AS "listingCode"
     FROM "bnhub_listings" l
     WHERE l."listingStatus" = 'PUBLISHED'
       AND l."id" <> $1
     LIMIT $2`,
    [listingId, CANDIDATE_LIMIT]
  );
}

function rowToSimilarInput(r: CandidateRow): SimilarListingInput {
  return {
    city: r.city,
    propertyType: r.propertyType,
    price: toNum(r.nightPrice) ?? 0,
    rating: toNum(r.rating),
    bookingsLast30d: toNum(r.bookingsLast30d) ?? 0,
    views: toNum(r.views) ?? 0,
  };
}

export type ScoredStayRecommendation = CandidateRow & {
  score: number;
};

/**
 * Ranks by similarity + demand boost (trending upweight).
 */
export function rankRecommendations(anchor: SimilarListingInput, candidates: CandidateRow[]): ScoredStayRecommendation[] {
  return candidates
    .map((c) => {
      const sim = computeSimilarity(anchor, rowToSimilarInput(c));
      const demand = demandBoost({
        bookingsLast30d: toNum(c.bookingsLast30d) ?? 0,
        views: toNum(c.views) ?? 0,
      });
      return { ...c, score: sim + demand };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, DEFAULT_TOP);
}

/**
 * Incorporates per-user `user_preferences` taste (see {@link applyPersonalization}).
 */
export function enhanceWithUserPrefs(
  listings: ScoredStayRecommendation[],
  prefs: UserPrefRow[]
): ScoredStayRecommendation[] {
  if (prefs.length === 0) return listings;
  const personalScale = Math.min(1, Math.max(0, prefs.length / 3));
  const next = listings.map((l) => {
    const searchable: SearchableListing = {
      title: l.title,
      description: l.description,
      city: l.city,
      propertyType: l.propertyType,
      rating: toNum(l.rating),
      price: toNum(l.nightPrice) ?? undefined,
      marketPrice: toNum(l.marketPrice) ?? undefined,
    };
    const { boost } = applyPersonalization(searchable, prefs, personalScale);
    return { ...l, score: l.score + boost };
  });
  return next.sort((a, b) => b.score - a.score);
}

export type BnHubRecommendationResponseItem = {
  id: string;
  listingCode: string | null;
  title: string;
  city: string;
  nightPriceCents: number;
  propertyType: string | null;
  score: number;
  rating: number | null;
};

/**
 * Public entry for the `/api/recommendations/[id]` route.
 */
export async function getSimilarStayRecommendations(
  listingId: string,
  userId: string | null
): Promise<{ ok: true; items: BnHubRecommendationResponseItem[] } | { ok: false; error: "not_found" }> {
  const rows = await query<{
    id: string;
    city: string;
    propertyType: string | null;
    nightPrice: string | number;
    rating: string | number | null;
  }>(
    `SELECT
       l."id",
       l."city",
       l."propertyType" AS "propertyType",
       (l."nightPriceCents"::float / 100.0) AS "nightPrice",
       l."bnhub_listing_rating_average" AS "rating"
     FROM "bnhub_listings" l
     WHERE l."id" = $1 AND l."listingStatus" = 'PUBLISHED'`,
    [listingId]
  );
  const a = rows[0];
  if (!a) {
    return { ok: false, error: "not_found" };
  }
  const anchor: SimilarListingInput = {
    city: a.city,
    propertyType: a.propertyType,
    price: toNum(a.nightPrice) ?? 0,
    rating: toNum(a.rating),
  };

  const candidates = await getCandidates(listingId);
  let ranked = rankRecommendations(anchor, candidates);
  if (userId) {
    const prefs = await getPreferences(userId);
    ranked = enhanceWithUserPrefs(ranked, prefs).slice(0, DEFAULT_TOP);
  }

  const items: BnHubRecommendationResponseItem[] = ranked.map((r) => {
    const cents = Math.round((toNum(r.nightPrice) ?? 0) * 100);
    return {
      id: r.id,
      listingCode: r.listingCode,
      title: r.title,
      city: r.city,
      nightPriceCents: cents,
      propertyType: r.propertyType,
      score: r.score,
      rating: toNum(r.rating),
    };
  });

  return { ok: true, items };
}
