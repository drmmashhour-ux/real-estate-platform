import { generateSocialProof } from "@/lib/ai/socialProof";
import { getListingAvailability, getOccupancyRatesForListings } from "@/lib/booking/availability";
import { flags } from "@/lib/flags";
import { hasMarketplaceListingDemandData } from "@/lib/market/demandHeatmap";
import { query } from "@/lib/sql";

/**
 * Per-listing pricing **recommendations** (read-only). Does not update `nightPriceCents`.
 */
export type ListingPricingRecommendation = {
  listingId: string;
  city: string;
  conversionRate: number;
  /** Total revenue in marketplace shadow ledger / max(views, 1). */
  revenuePerView: number;
  views: number;
  bookings: number;
  totalRevenue: number;
  recommendation: "increase_price" | "decrease_price" | "keep_price";
  suggestedAdjustmentPercent: number;
  reason: string;
};

type Row = {
  listingId: string;
  city: string;
  views: string | null;
  bookings: string | null;
  revenue: string | null;
  ratingAvg: string | null;
};

const HIGH_CONVERSION = 0.08;

/** Order A.1 — +2…+5% when recent nights are highly booked. */
function occupancyPriceBump(occupancyRate: number | undefined): number {
  if (occupancyRate == null || occupancyRate <= 0.7) return 0;
  return Math.round(2 + 3 * ((Math.min(1, occupancyRate) - 0.7) / 0.3));
}

function scoreAndRecommend(r: {
  views: number;
  bookings: number;
  totalRevenue: number;
  /** Optional; from `bnhub_listing_rating_average` when available. */
  rating?: number;
  /** Optional; from {@link getOccupancyRatesForListings} / {@link getListingAvailability}. */
  occupancyRate?: number;
}): {
  conversionRate: number;
  revenuePerView: number;
  recommendation: ListingPricingRecommendation["recommendation"];
  suggestedAdjustmentPercent: number;
  reason: string;
} {
  const views = Math.max(0, r.views);
  const conversionRate = views > 0 ? r.bookings / views : 0;
  const revenuePerView = views > 0 ? r.totalRevenue / views : 0;
  const sp = generateSocialProof({
    bookings: r.bookings,
    views: r.views,
    rating: r.rating ?? 0,
  });
  if (views >= 15 && conversionRate < 0.02) {
    return {
      conversionRate,
      revenuePerView,
      recommendation: "decrease_price",
      suggestedAdjustmentPercent: -5,
      reason: "High visibility but weak conversion — consider softening price.",
    };
  }
  if (conversionRate >= 0.08 || (views > 0 && r.bookings >= 2 && revenuePerView > 0.5)) {
    let suggested = 5;
    let reason = "Strong conversion and revenue per view — headroom to raise nightly rate slightly.";
    if (sp.strength === "high" && conversionRate >= HIGH_CONVERSION) {
      suggested = Math.min(30, suggested + 2);
      reason = `${reason} Social proof and conversion are strong; a modest additional lift (+2%) is supportable.`;
    }
    const ob = occupancyPriceBump(r.occupancyRate);
    if (ob > 0) {
      suggested = Math.min(30, suggested + ob);
      reason = `${reason} Calendar occupancy supports up to +${ob}% on top.`;
    }
    return {
      conversionRate,
      revenuePerView,
      recommendation: "increase_price",
      suggestedAdjustmentPercent: suggested,
      reason,
    };
  }
  if (conversionRate >= 0.04) {
    let suggested = 3;
    let reason = "Solid engagement — small upward adjustment is reasonable.";
    if (sp.strength === "high" && conversionRate >= HIGH_CONVERSION) {
      suggested = Math.min(30, suggested + 2);
      reason = `${reason} Social proof and strong conversion support a slight extra nudge.`;
    }
    const ob2 = occupancyPriceBump(r.occupancyRate);
    if (ob2 > 0) {
      suggested = Math.min(30, suggested + ob2);
      reason = `${reason} High recent occupancy (demand) supports +${ob2}% extra.`;
    }
    return {
      conversionRate,
      revenuePerView,
      recommendation: "increase_price",
      suggestedAdjustmentPercent: suggested,
      reason,
    };
  }
  if (r.occupancyRate != null && r.occupancyRate > 0.72) {
    const bump = occupancyPriceBump(r.occupancyRate);
    return {
      conversionRate,
      revenuePerView,
      recommendation: "increase_price",
      suggestedAdjustmentPercent: Math.min(30, Math.max(2, bump)),
      reason: `Recent calendar load is high (~${Math.round(r.occupancyRate * 100)}% of nights in the last 30d) — a modest +${bump}% lift is a reasonable test.`,
    };
  }
  return {
    conversionRate,
    revenuePerView,
    recommendation: "keep_price",
    suggestedAdjustmentPercent: 0,
    reason: "Stable signals — hold and monitor next window.",
  };
}

async function loadFromMarketplace(): Promise<Row[]> {
  return query<Row>(`
    WITH "rev" AS (
      SELECT "listing_id", COALESCE(SUM("amount")::float, 0) AS "total"
      FROM "marketplace_revenue_entries"
      GROUP BY "listing_id"
    ),
    "ev" AS (
      SELECT
        (e."data"->>'listingId') AS "lid",
        COUNT(*) FILTER (WHERE e."event" = 'listing_view')::bigint AS "v",
        COUNT(*) FILTER (WHERE e."event" = 'booking_created')::bigint AS "b"
      FROM "marketplace_events" e
      WHERE (e."data" ? 'listingId') AND e."event" IN ('listing_view', 'booking_created')
      GROUP BY 1
    )
    SELECT
      l."id"::text AS "listingId",
      l."city" AS "city",
      COALESCE(ev."v", 0)::text AS "views",
      COALESCE(ev."b", 0)::text AS "bookings",
      COALESCE(rev."total", 0)::text AS "revenue",
      l."bnhub_listing_rating_average"::text AS "ratingAvg"
    FROM "bnhub_listings" l
    LEFT JOIN "ev" ON l."id"::text = "ev"."lid"
    LEFT JOIN "rev" ON "rev"."listing_id" = l."id"
    WHERE l."listingStatus"::text = 'PUBLISHED'
      AND l."city" IS NOT NULL
      AND btrim(l."city") != ''
      AND (COALESCE(ev."v", 0) > 0 OR COALESCE(ev."b", 0) > 0 OR COALESCE(rev."total", 0) > 0)
    ORDER BY (COALESCE(ev."v", 0) + COALESCE(ev."b", 0) * 10) DESC, COALESCE(rev."total", 0) DESC
    LIMIT 80
  `);
}

async function loadFromLegacy(): Promise<Row[]> {
  return query<Row>(`
    WITH "rev" AS (
      SELECT "listing_id", COALESCE(SUM("amount")::float, 0) AS "total"
      FROM "marketplace_revenue_entries"
      GROUP BY "listing_id"
    ),
    "views" AS (
      SELECT e."supabase_listing_id" AS "id", COUNT(e."id")::bigint AS "v"
      FROM "bnhub_client_listing_view_events" e
      GROUP BY 1
    ),
    "books" AS (
      SELECT b."listingId" AS "id", COUNT(b."id")::bigint AS "b"
      FROM "Booking" b
      WHERE b."status"::text IN (
        'CONFIRMED', 'COMPLETED', 'AWAITING_HOST_APPROVAL', 'PENDING'
      )
      GROUP BY 1
    )
    SELECT
      l."id"::text AS "listingId",
      l."city" AS "city",
      COALESCE(vt."v", 0)::text AS "views",
      COALESCE(bk."b", 0)::text AS "bookings",
      COALESCE(rev."total", 0)::text AS "revenue",
      l."bnhub_listing_rating_average"::text AS "ratingAvg"
    FROM "bnhub_listings" l
    LEFT JOIN "views" vt ON vt."id" = l."id"
    LEFT JOIN "books" bk ON bk."id" = l."id"
    LEFT JOIN "rev" ON "rev"."listing_id" = l."id"
    WHERE l."listingStatus"::text = 'PUBLISHED'
      AND l."city" IS NOT NULL
      AND btrim(l."city") != ''
      AND (COALESCE(vt."v", 0) > 0 OR COALESCE(bk."b", 0) > 0 OR COALESCE(rev."total", 0) > 0)
    ORDER BY (COALESCE(vt."v", 0) + COALESCE(bk."b", 0) * 10) DESC, COALESCE(rev."total", 0) DESC
    LIMIT 80
  `);
}

/**
 * Listing-level dynamic pricing **recommendations** (top signals first). No DB writes.
 */
export async function getListingPricingRecommendations(): Promise<ListingPricingRecommendation[]> {
  if (!flags.AI_PRICING) {
    return [];
  }
  const useMarketplace = await hasMarketplaceListingDemandData();
  const raw = useMarketplace ? await loadFromMarketplace() : await loadFromLegacy();
  const occBy = await getOccupancyRatesForListings(raw.map((r) => r.listingId)).catch(() => ({} as Record<string, number>));
  const out: ListingPricingRecommendation[] = [];
  for (const row of raw) {
    const views = Number(row.views) || 0;
    const bookings = Number(row.bookings) || 0;
    const totalRevenue = Number(row.revenue) || 0;
    const rating = (() => {
      const x = Number.parseFloat(row.ratingAvg ?? "0");
      return Number.isFinite(x) ? x : 0;
    })();
    const s = scoreAndRecommend({
      views,
      bookings,
      totalRevenue,
      rating,
      occupancyRate: occBy[row.listingId],
    });
    out.push({
      listingId: row.listingId,
      city: row.city,
      views,
      bookings,
      totalRevenue,
      ...s,
    });
  }
  return out;
}

type OneRow = { v: string | null; b: string | null; rev: string | null; ravg: string | null };

/**
 * Read-only pricing signal for a single listing (conversion / intent; no DB writes).
 * Does not require `FEATURE_AI_PRICING` — uses the same marketplace vs legacy demand path as bulk recommendations.
 */
export async function getListingPricingSignalForId(
  listingId: string
): Promise<"increase_price" | "decrease_price" | "keep_price" | null> {
  const useMarketplace = await hasMarketplaceListingDemandData();
  if (useMarketplace) {
    const rows = await query<OneRow>(
      `
      WITH "rev" AS (
        SELECT COALESCE(SUM("amount")::float, 0) AS "total"
        FROM "marketplace_revenue_entries"
        WHERE "listing_id" = $1
      ),
      "ev" AS (
        SELECT
          COUNT(*) FILTER (WHERE e."event" = 'listing_view')::bigint AS "v",
          COUNT(*) FILTER (WHERE e."event" = 'booking_created')::bigint AS "b"
        FROM "marketplace_events" e
        WHERE (e."data"->>'listingId') = $1
      )
      SELECT
        ev."v"::text AS "v",
        ev."b"::text AS "b",
        (SELECT "total"::text FROM "rev") AS "rev",
        (SELECT l2."bnhub_listing_rating_average"::text FROM "bnhub_listings" l2 WHERE l2."id"::text = $1 LIMIT 1) AS "ravg"
      FROM "ev"
    `,
      [listingId]
    );
    const r = rows[0];
    if (!r) return null;
    const views = Number.parseInt(r.v ?? "0", 10) || 0;
    const bookings = Number.parseInt(r.b ?? "0", 10) || 0;
    const totalRevenue = Number.parseFloat(r.rev ?? "0") || 0;
    const rating = (() => {
      const x = Number.parseFloat(r.ravg ?? "0");
      return Number.isFinite(x) ? x : 0;
    })();
    const occ = await getListingAvailability(listingId).catch(() => null);
    const s = scoreAndRecommend({
      views,
      bookings,
      totalRevenue,
      rating,
      occupancyRate: occ?.occupancyRate,
    });
    return s.recommendation;
  }
  const rows = await query<OneRow>(
    `
    WITH "rev" AS (
      SELECT COALESCE(SUM("amount")::float, 0) AS "total"
      FROM "marketplace_revenue_entries"
      WHERE "listing_id" = $1
    ),
    "views" AS (
      SELECT COUNT(e."id")::bigint AS "v"
      FROM "bnhub_client_listing_view_events" e
      WHERE e."supabase_listing_id" = $1
    ),
    "books" AS (
      SELECT COUNT(b."id")::bigint AS "b"
      FROM "Booking" b
      WHERE b."listingId" = $1
        AND b."status"::text IN (
          'CONFIRMED', 'COMPLETED', 'AWAITING_HOST_APPROVAL', 'PENDING'
        )
    )
    SELECT
      v."v"::text AS "v",
      bk."b"::text AS "b",
      (SELECT "total"::text FROM "rev") AS "rev",
      (SELECT l2."bnhub_listing_rating_average"::text FROM "bnhub_listings" l2 WHERE l2."id"::text = $1 LIMIT 1) AS "ravg"
    FROM "views" v
    CROSS JOIN "books" bk
  `,
    [listingId]
  );
  const r = rows[0];
  if (!r) return null;
  const views = Number.parseInt(r.v ?? "0", 10) || 0;
  const bookings = Number.parseInt(r.b ?? "0", 10) || 0;
  const totalRevenue = Number.parseFloat(r.rev ?? "0") || 0;
  const rating = (() => {
    const x = Number.parseFloat(r.ravg ?? "0");
    return Number.isFinite(x) ? x : 0;
  })();
  const occ = await getListingAvailability(listingId).catch(() => null);
  const s = scoreAndRecommend({ views, bookings, totalRevenue, rating, occupancyRate: occ?.occupancyRate });
  return s.recommendation;
}
