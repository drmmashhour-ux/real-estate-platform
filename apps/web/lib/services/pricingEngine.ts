import { logDbError } from "@/lib/observability/structured-log";
import { query } from "@/lib/sql";
import { getLearningWeight } from "@/lib/ab/learn";

export type PricingDataSource = "bnhub" | "marketplace";

export type PricingStatsRow = {
  night_price_cents: string | null;
  avg_realized_night_cents: string | null;
  booked_nights_90d: string | null;
  demand_bookings_30d: string | null;
};

/** Shared SELECT shape for BNHub stay listing + `Booking` signals (table `bnhub_listings`). */
const PRICING_SQL_BNHUB = `
    SELECT
      stl."nightPriceCents"::text AS night_price_cents,
      (
        SELECT COALESCE(
          AVG(b."totalCents"::double precision / GREATEST(b.nights, 1))
          FILTER (
            WHERE (b.status::text) IN (
              'CONFIRMED',
              'COMPLETED',
              'AWAITING_HOST_APPROVAL'
            )
            AND b."checkIn" >= (CURRENT_TIMESTAMP - interval '180 days')
          ),
          NULL
        )::text
        FROM "Booking" b
        WHERE b."listingId" = stl."id"
      ) AS avg_realized_night_cents,
      (
        SELECT COALESCE(
          SUM(b.nights)
          FILTER (
            WHERE (b.status::text) IN (
              'CONFIRMED',
              'COMPLETED',
              'AWAITING_HOST_APPROVAL'
            )
            AND b."checkIn" >= (CURRENT_TIMESTAMP - interval '90 days')
          ),
          0
        )::text
        FROM "Booking" b
        WHERE b."listingId" = stl."id"
      ) AS booked_nights_90d,
      (
        SELECT COALESCE(
          COUNT(*)::int,
          0
        )::text
        FROM "Booking" b
        WHERE b."listingId" = stl."id"
          AND (b.status::text) IN (
            'CONFIRMED',
            'COMPLETED',
            'AWAITING_HOST_APPROVAL',
            'PENDING'
          )
          AND b."checkIn" >= (CURRENT_TIMESTAMP - interval '30 days')
      ) AS demand_bookings_30d
    FROM "bnhub_listings" stl
    WHERE stl."id" = $1
`;

/**
 * CRM `Listing` + `listing_bookings` (visit/interaction windows — no `totalCents`; base is `price` in major units as proxy “list” reference).
 * See bnhub path for true nightly STR pricing.
 */
const PRICING_SQL_MARKETPLACE = `
    SELECT
      (ROUND(l.price::numeric * 100))::text AS night_price_cents,
      NULL::text AS avg_realized_night_cents,
      (
        SELECT COALESCE(
          SUM(GREATEST(1, (b.end_date::date - b.start_date::date))::int),
          0
        )::text
        FROM "listing_bookings" b
        WHERE b.listing_id = l.id
          AND b.end_date > (CURRENT_TIMESTAMP - interval '90 days')
      ) AS booked_nights_90d,
      (
        SELECT COALESCE(COUNT(*)::int, 0)::text
        FROM "listing_bookings" b
        WHERE b.listing_id = l.id
          AND b.created_at >= (CURRENT_TIMESTAMP - interval '30 days')
      ) AS demand_bookings_30d
    FROM "Listing" l
    WHERE l.id = $1
`;

/**
 * Load pricing stats for either BNHub stays (`bnhub_listings` + `Booking`) or CRM marketplace (`Listing` + `listing_bookings`).
 */
export async function getPricingData(
  id: string,
  source: PricingDataSource
): Promise<PricingStatsRow[]> {
  try {
    if (source === "bnhub") {
      return await query<PricingStatsRow>(PRICING_SQL_BNHUB, [id]);
    }
    if (source === "marketplace") {
      return await query<PricingStatsRow>(PRICING_SQL_MARKETPLACE, [id]);
    }
    const _n: never = source;
    void _n;
    throw new Error("getPricingData: unknown source");
  } catch (e) {
    logDbError("getPricingData", e, { id, source });
    return [];
  }
}

function suggestedDollarsFromStatsRow(row: PricingStatsRow | undefined): number | null {
  if (!row) return null;

  const listBaseCents = Number(row.night_price_cents);
  if (!Number.isFinite(listBaseCents) || listBaseCents <= 0) {
    return null;
  }

  const avgRealized = row.avg_realized_night_cents
    ? Number(row.avg_realized_night_cents)
    : null;
  const baseCents =
    avgRealized != null && Number.isFinite(avgRealized) && avgRealized > 0
      ? avgRealized
      : listBaseCents;

  const bookedN90 = row.booked_nights_90d ? Number(row.booked_nights_90d) : 0;
  const occupancyRate = Math.min(1, Math.max(0, bookedN90 / 90));

  let multiplier = 1;
  if (occupancyRate > 0.7) multiplier += 0.25;
  if (occupancyRate < 0.3) multiplier -= 0.15;

  const demand = row.demand_bookings_30d ? Number(row.demand_bookings_30d) : 0;
  if (demand >= 5) {
    multiplier += 0.05;
  } else if (demand === 0 && occupancyRate < 0.2) {
    multiplier -= 0.05;
  }

  const month = new Date().getMonth();
  if (month >= 5 && month <= 7) {
    multiplier += 0.05;
  }

  const suggestedCents = baseCents * multiplier;
  return Math.round(suggestedCents) / 100;
}

/**
 * BNHub-style dynamic nightly price from `getPricingData(id, "bnhub")` (same as historical single-path API).
 *
 * @param shortTermListingId — `ShortTermListing.id` on `bnhub_listings` (joins to `"Booking"."listingId"`).
 */
export async function getDynamicPrice(shortTermListingId: string): Promise<number | null> {
  const rows = await getPricingData(shortTermListingId, "bnhub");
  return suggestedDollarsFromStatsRow(rows[0]);
}

/**
 * Same engine, explicit data source (BNHub STR vs CRM `Listing`).
 */
export async function getDynamicPriceForSource(
  listingId: string,
  source: PricingDataSource
): Promise<number | null> {
  const rows = await getPricingData(listingId, source);
  return suggestedDollarsFromStatsRow(rows[0]);
}

/**
 * Same as `getDynamicPrice` for BNHub, then multiplies by learned `price_sensitivity` (0.5–2 from
 * `learning_metrics`, default 0.8 when unset). **Additive**; keep using `getDynamicPrice` for legacy behavior.
 */
export async function getDynamicPriceWithLearning(shortTermListingId: string): Promise<number | null> {
  const base = await getDynamicPrice(shortTermListingId);
  if (base == null) return null;
  try {
    const sensitivity = await getLearningWeight("price_sensitivity", 0.8);
    return base * (1 + 0.1 * sensitivity);
  } catch (e) {
    logDbError("getDynamicPriceWithLearning", e, { shortTermListingId });
    return base;
  }
}
