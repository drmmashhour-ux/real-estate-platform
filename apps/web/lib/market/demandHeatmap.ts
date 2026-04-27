import { CACHE_KEYS, getCached } from "@/lib/cache";
import { query } from "@/lib/sql";

/**
 * **Primary:** `marketplace_events` (unified `trackEvent` → `listing_view` / `booking_created` with
 * `data.listingId` joined to `bnhub_listings`).
 * **Fallback:** if there are no qualifying marketplace rows yet, legacy
 * `bnhub_client_listing_view_events` + `Booking` (temporary safety during rollout).
 *
 * **Demand score** uses per-listing rates (totals / published listing count in the city) so large
 * metros do not drown out smaller, high-converting markets.
 */
export type DemandHeatmapRow = {
  city: string;
  /** Total guest view events in the city. */
  views: number;
  /** Count of qualifying bookings in the city (all time) — from marketplace `booking_created` or legacy `Booking` rows. */
  bookings: number;
  /** Published `bnhub_listings` in the city; denominator for per-listing rates. */
  listingCount: number;
  /** `views / listingCount` — comparable across cities. */
  viewsPerListing: number;
  /** `bookings / listingCount` — comparable across cities. */
  bookingsPerListing: number;
  /** City-level efficiency: `views > 0 ? bookings / views : 0`. */
  conversionRate: number;
  /**
   * Weighted index from per-listing rates: `bookingsPerListing * 5 + viewsPerListing * 0.1`
   * (replaces raw `bookings * 5 + views * 0.1` for cross-city fairness).
   */
  demandScore: number;
  /** Bookings in the last 7 days. */
  bookings7d: number;
  /** Bookings in the 7 days before that. */
  bookingsPrev7d: number;
  /**
   * Relative change in recent bookings: `(bookings7d - bookingsPrev7d) / bookingsPrev7d`
   * when `bookingsPrev7d > 0`, else `0`.
   */
  trend: number;
};

type SqlRow = {
  city: string;
  listingCount: string | null;
  views: string | null;
  bookings: string | null;
  bookings7d: string | null;
  bookingsPrev7d: string | null;
};

const HEATMAP_CACHE_TTL_MS = 30_000;
type HeatmapCache = { expiresAt: number; rows: DemandHeatmapRow[] };
let heatmapCache: HeatmapCache | null = null;

function computeDemandScore(viewsPerListing: number, bookingsPerListing: number): number {
  return bookingsPerListing * 5 + viewsPerListing * 0.1;
}

function mapSqlRowsToHeatmap(rows: SqlRow[]): DemandHeatmapRow[] {
  return rows.map((row) => {
    const views = Number(row.views) || 0;
    const bookings = Number(row.bookings) || 0;
    const listingCount = Math.max(0, Math.floor(Number(row.listingCount) || 0));
    const viewsPerListing = listingCount > 0 ? views / listingCount : 0;
    const bookingsPerListing = listingCount > 0 ? bookings / listingCount : 0;
    const demandScore = computeDemandScore(viewsPerListing, bookingsPerListing);
    const conversionRate = views > 0 ? bookings / views : 0;
    const bookings7d = Number(row.bookings7d) || 0;
    const bookingsPrev7d = Number(row.bookingsPrev7d) || 0;
    const trend = bookingsPrev7d > 0 ? (bookings7d - bookingsPrev7d) / bookingsPrev7d : 0;

    return {
      city: row.city,
      views,
      bookings,
      listingCount,
      viewsPerListing,
      bookingsPerListing,
      conversionRate,
      demandScore,
      bookings7d,
      bookingsPrev7d,
      trend,
    };
  });
}

/**
 * True once any unified marketplace event exists (standard names + listingId) — if false, use legacy
 * `bnhub_client_listing_view_events` + `Booking` for demand until rollout backfills.
 */
export async function hasMarketplaceListingDemandData(): Promise<boolean> {
  const r = await query<{ ok: string | null }>(
    `
    SELECT 1::text AS ok
    FROM "marketplace_events" e
    WHERE e."event" IN ('listing_view', 'booking_created')
      AND (e."data" ? 'listingId')
    LIMIT 1
  `
  );
  return r.length > 0;
}

/** Demand from `marketplace_events` (views + `booking_created` + 7d trend on same log). */
async function getDemandHeatmapFromMarketplaceEvents(): Promise<SqlRow[]> {
  return query<SqlRow>(`
    WITH "listingCountByCity" AS (
      SELECT
        l."city" AS "city",
        COUNT(DISTINCT l."id")::bigint AS "listingCount"
      FROM "bnhub_listings" l
      WHERE l."listing_status" = 'PUBLISHED'
        AND l."city" IS NOT NULL
        AND btrim(l."city") != ''
      GROUP BY l."city"
    ),
    "eventsByCity" AS (
      SELECT
        l."city" AS "city",
        COUNT(*) FILTER (WHERE e."event" = 'listing_view')::bigint AS "views",
        COUNT(*) FILTER (WHERE e."event" = 'booking_created')::bigint AS "bookings",
        COUNT(*) FILTER (
          WHERE e."event" = 'booking_created' AND e."created_at" >= NOW() - INTERVAL '7 days'
        )::bigint AS "bookings7d",
        COUNT(*) FILTER (
          WHERE e."event" = 'booking_created'
            AND e."created_at" >= NOW() - INTERVAL '14 days'
            AND e."created_at" < NOW() - INTERVAL '7 days'
        )::bigint AS "bookingsPrev7d"
      FROM "marketplace_events" e
      INNER JOIN "bnhub_listings" l
        ON l."id"::text = (e."data"->>'listingId')
      WHERE (e."data" ? 'listingId')
        AND e."event" IN ('listing_view', 'booking_created')
        AND l."listing_status" = 'PUBLISHED'
        AND l."city" IS NOT NULL
        AND btrim(l."city") != ''
      GROUP BY l."city"
    )
    SELECT
      c."city" AS "city",
      c."listingCount"::text AS "listingCount",
      COALESCE(v."views", 0)::text AS "views",
      COALESCE(v."bookings", 0)::text AS "bookings",
      COALESCE(v."bookings7d", 0)::text AS "bookings7d",
      COALESCE(v."bookingsPrev7d", 0)::text AS "bookingsPrev7d"
    FROM "listingCountByCity" c
    LEFT JOIN "eventsByCity" v ON v."city" = c."city"
  `);
}

/** Legacy: client view table + `Booking` (used when `marketplace_events` has no listing-linked rows yet). */
async function getDemandHeatmapFromLegacy(): Promise<SqlRow[]> {
  return query<SqlRow>(`
    WITH "listingCountByCity" AS (
      SELECT
        l."city" AS "city",
        COUNT(DISTINCT l."id")::bigint AS "listingCount"
      FROM "bnhub_listings" l
      WHERE l."listing_status" = 'PUBLISHED'
        AND l."city" IS NOT NULL
        AND btrim(l."city") != ''
      GROUP BY l."city"
    ),
    "viewsByCity" AS (
      SELECT
        l."city" AS "city",
        COUNT(e."id")::bigint AS "views"
      FROM "bnhub_listings" l
      LEFT JOIN "bnhub_client_listing_view_events" e
        ON e."supabase_listing_id" = l."id"
      WHERE l."listing_status" = 'PUBLISHED'
        AND l."city" IS NOT NULL
        AND btrim(l."city") != ''
      GROUP BY l."city"
    ),
    "bookingsByCity" AS (
      SELECT
        l."city" AS "city",
        COUNT(b."id")::bigint AS "bookings",
        COUNT(*) FILTER (WHERE b."createdAt" >= NOW() - INTERVAL '7 days')::bigint AS "bookings7d",
        COUNT(*) FILTER (
          WHERE b."createdAt" >= NOW() - INTERVAL '14 days'
            AND b."createdAt" < NOW() - INTERVAL '7 days'
        )::bigint AS "bookingsPrev7d"
      FROM "Booking" b
      INNER JOIN "bnhub_listings" l ON l."id" = b."listingId"
      WHERE l."city" IS NOT NULL
        AND btrim(l."city") != ''
        AND l."listing_status" = 'PUBLISHED'
        AND b."status"::text IN (
          'CONFIRMED',
          'COMPLETED',
          'AWAITING_HOST_APPROVAL',
          'PENDING'
        )
      GROUP BY l."city"
    )
    SELECT
      c."city" AS "city",
      c."listingCount"::text AS "listingCount",
      COALESCE(v."views", 0)::text AS "views",
      COALESCE(b."bookings", 0)::text AS "bookings",
      COALESCE(b."bookings7d", 0)::text AS "bookings7d",
      COALESCE(b."bookingsPrev7d", 0)::text AS "bookingsPrev7d"
    FROM "listingCountByCity" c
    LEFT JOIN "viewsByCity" v ON v."city" = c."city"
    LEFT JOIN "bookingsByCity" b ON b."city" = c."city"
  `);
}

async function loadDemandHeatmap(): Promise<DemandHeatmapRow[]> {
  const useMarketplace = await hasMarketplaceListingDemandData();
  const rawRows = useMarketplace
    ? await getDemandHeatmapFromMarketplaceEvents()
    : await getDemandHeatmapFromLegacy();

  const mapped = mapSqlRowsToHeatmap(rawRows);
  mapped.sort((a, b) => b.demandScore - a.demandScore);
  return mapped;
}

/** 30s in-process TTL via {@link getCached} (Order 73.2). */
export async function getDemandHeatmap(): Promise<DemandHeatmapRow[]> {
  return getCached(CACHE_KEYS.demandHeatmap, 30, loadDemandHeatmap);
}
