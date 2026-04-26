import { query } from "@/lib/sql";

type PricingStatsRow = {
  night_price_cents: string | null;
  avg_realized_night_cents: string | null;
  booked_nights_90d: string | null;
  demand_bookings_30d: string | null;
};

/**
 * BNHub-style dynamic nightly price hint from live booking signals.
 *
 * @param shortTermListingId — `ShortTermListing.id` (joins to `"Booking"."listingId"`), not CRM `Listing.id`.
 * @returns Suggested **price in major units** (e.g. dollars) rounded, or `null` if the listing is unknown.
 */
export async function getDynamicPrice(
  shortTermListingId: string
): Promise<number | null> {
  const rows = await query<PricingStatsRow>(
    `
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
    FROM "ShortTermListing" stl
    WHERE stl."id" = $1
    `,
    [shortTermListingId]
  );

  const row = rows[0];
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

  const bookedN90 = row.booked_nights_90d
    ? Number(row.booked_nights_90d)
    : 0;
  const occupancyRate = Math.min(1, Math.max(0, bookedN90 / 90));

  let multiplier = 1;
  if (occupancyRate > 0.7) multiplier += 0.25;
  if (occupancyRate < 0.3) multiplier -= 0.15;

  const demand = row.demand_bookings_30d
    ? Number(row.demand_bookings_30d)
    : 0;
  if (demand >= 5) {
    multiplier += 0.05;
  } else if (demand === 0 && occupancyRate < 0.2) {
    multiplier -= 0.05;
  }

  // Light seasonality: northern summer lift (simplified; replace with market-specific curves later)
  const month = new Date().getMonth();
  if (month >= 5 && month <= 7) {
    multiplier += 0.05;
  }

  const suggestedCents = baseCents * multiplier;
  return Math.round(suggestedCents) / 100;
}
