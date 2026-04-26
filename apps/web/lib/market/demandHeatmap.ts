import { query } from "@/lib/sql";

/**
 * There is no `MarketplaceEvent` table in the monolith. We approximate intent with:
 * - **views** — `bnhub_client_listing_view_events` joined to `bnhub_listings` (guest listing_view stream).
 * - **bookings** — `Booking` rows on BNHub listings in active-ish statuses, grouped by `city`.
 */
export type DemandHeatmapRow = {
  city: string;
  views: number;
  bookings: number;
  demandScore: number;
};

type SqlRow = {
  city: string;
  views: string | null;
  bookings: string | null;
};

export async function getDemandHeatmap(): Promise<DemandHeatmapRow[]> {
  const rows = await query<SqlRow>(`
    WITH "viewsByCity" AS (
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
        COUNT(b."id")::bigint AS "bookings"
      FROM "Booking" b
      INNER JOIN "bnhub_listings" l ON l."id" = b."listingId"
      WHERE l."city" IS NOT NULL
        AND btrim(l."city") != ''
        AND b."status"::text IN (
          'CONFIRMED',
          'COMPLETED',
          'AWAITING_HOST_APPROVAL',
          'PENDING'
        )
      GROUP BY l."city"
    )
    SELECT
      COALESCE(v."city", b."city") AS "city",
      COALESCE(v."views", 0)::text AS "views",
      COALESCE(b."bookings", 0)::text AS "bookings"
    FROM "viewsByCity" v
    FULL OUTER JOIN "bookingsByCity" b ON b."city" = v."city"
    ORDER BY
      COALESCE(b."bookings", 0) DESC,
      COALESCE(v."views", 0) DESC
  `);

  return rows.map((row) => {
    const views = Number(row.views) || 0;
    const bookings = Number(row.bookings) || 0;
    return {
      city: row.city,
      views,
      bookings,
      demandScore: bookings * 5 + views * 0.1,
    };
  });
}
