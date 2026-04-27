import "server-only";

import type { FeedListingForRank } from "@/lib/ai/feedRanking";
import { computeListingReputationFromMetrics } from "@/lib/ai/reputationScoringCore";
import { generateSocialProof } from "@/lib/ai/socialProof";
import { flags } from "@/lib/flags";
import { getDemandHeatmap } from "@/lib/market/demandHeatmap";
import { getOccupancyRatesForListings } from "@/lib/booking/availability";
import { query } from "@/lib/sql";

const FETCH_WINDOW = 50;
const PUBLISHED = "PUBLISHED";

function firstPhotoUrl(photosJson: unknown): string | null {
  if (photosJson == null) return null;
  if (Array.isArray(photosJson) && photosJson.length > 0) {
    const f = photosJson[0];
    if (typeof f === "string" && f.startsWith("http")) return f;
    if (typeof f === "object" && f && "url" in f && typeof (f as { url: string }).url === "string") {
      return (f as { url: string }).url;
    }
  }
  return null;
}

async function buildCityDemandMap(): Promise<Map<string, number>> {
  const rows = await getDemandHeatmap();
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = r.city?.trim().toLowerCase() ?? "";
    if (k) m.set(k, r.demandScore);
  }
  return m;
}

type SqlRow = {
  id: string;
  title: string | null;
  city: string | null;
  nightPriceCents: string | null;
  created_at: string;
  photos: unknown;
  view_count: string | null;
  completed_stays: string | null;
  rating_avg: string | null;
};

/**
 * Paged `bnhub_listings` for the feed. Cheap query (no join); photos from JSON.
 */
export async function loadFeedListingsFromDb(
  offset: number
): Promise<{ rows: FeedListingForRank[]; hasMore: boolean }> {
  const rows = await query<SqlRow>(
    `
    SELECT
      l."id"::text,
      l."title",
      l."city",
      l."nightPriceCents"::text,
      l."created_at"::text,
      l."photos",
      l."bnhub_listing_view_count"::text AS "view_count",
      l."bnhub_listing_completed_stays"::text AS "completed_stays",
      l."bnhub_listing_rating_average"::text AS "rating_avg",
      l."host_id"::text AS "owner_id",
      char_length(COALESCE(l."description", ''))::text AS "desc_len",
      (CASE
        WHEN l."photos" IS NOT NULL AND l."photos"::text != '[]' AND btrim(l."photos"::text) != 'null' THEN 1
        WHEN EXISTS (SELECT 1 FROM "BnhubListingPhoto" p WHERE p."listingId" = l."id")
        THEN 1
        ELSE 0
      END)::text AS "has_photo"
    FROM "bnhub_listings" l
    WHERE l."listingStatus"::text = $2
    ORDER BY l."created_at" DESC
    LIMIT ${FETCH_WINDOW} OFFSET $1
  `,
    [offset, PUBLISHED]
  );

  const heat = await buildCityDemandMap();
  const occById = await getOccupancyRatesForListings(rows.map((r) => r.id)).catch(() => ({} as Record<string, number>));
  const out: FeedListingForRank[] = rows.map((r) => {
    const cents = r.nightPriceCents != null ? Number.parseFloat(r.nightPriceCents) : 0;
    const price = Number.isFinite(cents) ? Math.round((cents / 100) * 100) / 100 : 0;
    const c = (r.city ?? "—").toString();
    const dKey = c.trim().toLowerCase();
    const demand = heat.get(dKey) ?? 0;
    let photos: unknown = r.photos;
    if (typeof photos === "string") {
      try {
        photos = JSON.parse(photos) as unknown;
      } catch {
        photos = null;
      }
    }
    const views = Math.max(0, Math.floor(Number.parseInt(r.view_count ?? "0", 10) || 0));
    const bookings = Math.max(0, Math.floor(Number.parseInt(r.completed_stays ?? "0", 10) || 0));
    const rating = (() => {
      const x = Number.parseFloat(r.rating_avg ?? "0");
      return Number.isFinite(x) ? x : 0;
    })();
    const sp = generateSocialProof({ views, bookings, rating });
    const dlen = Math.max(0, Math.floor(Number.parseInt(r.desc_len ?? "0", 10) || 0));
    const hasPhoto = (r.has_photo ?? "0") === "1" || firstPhotoUrl(photos) != null;
    const rep = flags.RECOMMENDATIONS
      ? computeListingReputationFromMetrics({
          listingId: r.id,
          bookings,
          views,
          rating,
          descriptionLength: dlen,
          hasPhoto,
        })
      : { listingId: r.id, score: 0, level: "low" as const, signals: [] };
    return {
      id: r.id,
      title: (r.title ?? "Stay").toString(),
      city: c,
      price,
      createdAt: new Date(r.created_at),
      demandScore: demand,
      imageUrl: firstPhotoUrl(photos),
      socialProofScore: sp.score,
      socialProofStrength: sp.strength,
      listingReputationScore: rep.score,
      reputationLevel: rep.level,
      ownerId: (r.owner_id ?? "").toString(),
      occupancyRate: occById[r.id] ?? 0,
    };
  });

  return { rows: out, hasMore: rows.length === FETCH_WINDOW };
}

export const FEED_WINDOW = FETCH_WINDOW;
