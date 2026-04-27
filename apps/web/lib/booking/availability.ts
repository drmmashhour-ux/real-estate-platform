/**
 * Order A.1 — Availability intelligence from real `Booking` rows (blocking statuses only).
 * `occupancyRate` = share of the last 30 **calendar** days (yesterday back) with a booked night; feed + pricing + conversion consume this.
 */
import "server-only";

import {
  addUtcDays,
  availabilityUrgencyMessage,
  firstAvailableNightFrom,
  getAvailabilityUrgencyLabel,
  mergeBookingIntervals,
  type ListingAvailability,
} from "@/lib/booking/availability-core";
import { readOnlyQuery } from "@/lib/db";

export type { ListingAvailability };
export { availabilityUrgencyMessage, getAvailabilityUrgencyLabel };

/**
 * Bookings that block the calendar (overlap engine–aligned; excludes cancel/expired/declined).
 */
const BLOCKING_STATUS_SQL = `(
  'CONFIRMED', 'AWAITING_HOST_APPROVAL', 'PENDING', 'COMPLETED', 'DISPUTED'
)`;

/**
 * Real availability from the `Booking` table (nights, overlap-safe dates).
 * - `totalBookedDays`: sum of `nights` for blocking rows (all time).
 * - `nextAvailableDate`: first calendar night (UTC) from **tomorrow** with no blocking booking, or `null` if none within the horizon.
 * - `occupancyRate`: share of the last 30 full calendar days (yesterday back 30) that have ≥1 blocked night, in `[0, 1]`.
 */
export async function getListingAvailability(listingId: string): Promise<ListingAvailability> {
  if (!listingId) {
    return { totalBookedDays: 0, nextAvailableDate: null, occupancyRate: 0 };
  }

  const [sumRow, bookRows, occCount] = await Promise.all([
    readOnlyQuery<{ t: string | null }>(
      `
      /* booking:availability */
      SELECT COALESCE(SUM(b.nights), 0)::text AS t
      FROM "Booking" b
      WHERE b."listingId" = $1
        AND b."status"::text IN ${BLOCKING_STATUS_SQL}
    `,
      [listingId]
    ),
    readOnlyQuery<{ checkIn: string; checkOut: string }>(
      `
      /* booking:availability */
      SELECT b."checkIn"::text AS "checkIn", b."checkOut"::text AS "checkOut"
      FROM "Booking" b
      WHERE b."listingId" = $1
        AND b."status"::text IN ${BLOCKING_STATUS_SQL}
        AND (b."checkOut")::date > CURRENT_DATE
      ORDER BY b."checkIn" ASC
    `,
      [listingId]
    ),
    readOnlyQuery<{ n: string | null }>(
      `
      /* booking:availability */
      WITH booked_days AS (
        SELECT DISTINCT (g.d)::date AS d
        FROM generate_series(
          (CURRENT_DATE - 30),
          (CURRENT_DATE - 1),
          '1 day'::interval
        ) g(d)
        WHERE EXISTS (
          SELECT 1
          FROM "Booking" b
          WHERE b."listingId" = $1
            AND b."status"::text IN ${BLOCKING_STATUS_SQL}
            AND (g.d)::date >= (b."checkIn")::date
            AND (g.d)::date < (b."checkOut")::date
        )
      )
      SELECT COUNT(*)::text AS n FROM booked_days
    `,
      [listingId]
    ),
  ]);

  const totalBookedDays = Math.max(0, Math.floor(Number.parseInt(sumRow[0]?.t ?? "0", 10) || 0));
  const occN = Math.max(0, Math.min(30, Math.floor(Number.parseInt(occCount[0]?.n ?? "0", 10) || 0)));
  const occupancyRate = Math.min(1, occN / 30);

  const bi = bookRows.map((r) => ({
    checkIn: new Date(r.checkIn),
    checkOut: new Date(r.checkOut),
  }));
  const merged = mergeBookingIntervals(bi);
  const tomorrow = addUtcDays(new Date(), 1);
  const nextAvailableDate = firstAvailableNightFrom(merged, tomorrow);

  return { totalBookedDays, nextAvailableDate, occupancyRate };
}

/**
 * Last-30d occupancy (0..1) for many listings — feed ranking boost. Missing ids → 0.
 */
export async function getOccupancyRatesForListings(listingIds: string[]): Promise<Record<string, number>> {
  if (listingIds.length === 0) return {};
  const rows = await readOnlyQuery<{ id: string; n: string | null }>(
    `
    /* booking:availability */
    SELECT
      u.id,
      (
        (SELECT COUNT(*)::float
         FROM (
           SELECT DISTINCT (g.d)::date AS d
           FROM generate_series(
             (CURRENT_DATE - 30),
             (CURRENT_DATE - 1),
             '1 day'::interval
           ) g(d)
           WHERE EXISTS (
             SELECT 1
             FROM "Booking" b
             WHERE b."listingId" = u.id
               AND b."status"::text IN ${BLOCKING_STATUS_SQL}
               AND (g.d)::date >= (b."checkIn")::date
               AND (g.d)::date < (b."checkOut")::date
           )
         ) x
        ) / 30.0
      )::text AS n
    FROM unnest($1::text[]) AS u(id)
  `,
    [listingIds]
  );
  const out: Record<string, number> = {};
  for (const r of rows) {
    const x = Number.parseFloat(r.n ?? "0");
    out[r.id] = Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0;
  }
  for (const id of listingIds) {
    if (out[id] === undefined) out[id] = 0;
  }
  return out;
}
