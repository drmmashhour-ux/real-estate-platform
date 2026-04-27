import { flags } from "@/lib/flags";
import { query } from "@/lib/sql";

export type RevenueIntelligence = {
  totalRevenue: number;
  /** Shadow ledger; zero when no rows. */
  avgRevenuePerListing: number;
  topCityByRevenue: string | null;
};

/**
 * Read-only rollups from `marketplace_revenue_entries` (shadow) + `bnhub_listings` city.
 */
export async function getRevenueIntelligence(): Promise<RevenueIntelligence> {
  if (!flags.AI_PRICING) {
    return { totalRevenue: 0, avgRevenuePerListing: 0, topCityByRevenue: null };
  }
  const totals = await query<{ total: string | null; n: string | null }>(
    `SELECT
       COALESCE(SUM("amount")::float, 0)::text AS "total",
       COUNT(DISTINCT "listing_id")::text AS "n"
     FROM "marketplace_revenue_entries"`
  );
  const totalRevenue = Number(totals[0]?.total) || 0;
  const n = Math.max(0, Math.floor(Number(totals[0]?.n) || 0));
  const avgRevenuePerListing = n > 0 ? totalRevenue / n : 0;

  const topCity = await query<{ city: string; s: string | null }>(
    `SELECT
       l."city" AS "city",
       COALESCE(SUM(m."amount")::float, 0)::text AS s
     FROM "marketplace_revenue_entries" m
     INNER JOIN "bnhub_listings" l ON l."id" = m."listing_id"
     WHERE l."city" IS NOT NULL AND btrim(l."city") != ''
     GROUP BY l."city"
     HAVING COALESCE(SUM(m."amount")::float, 0) > 0
     ORDER BY COALESCE(SUM(m."amount")::float, 0) DESC
     LIMIT 1`
  );
  const topCityByRevenue = topCity[0]?.city?.trim() || null;
  return { totalRevenue, avgRevenuePerListing, topCityByRevenue };
}
