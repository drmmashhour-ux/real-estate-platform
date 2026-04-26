import { query } from "@/lib/sql";

type CountRow = { users: string; listings: string; bookings: string };

/**
 * High-level platform counts for investor / demo dashboards. Uses a single round-trip SQL aggregation.
 * Tables: monolith `User`, `Listing` (CRM), `Booking` (BNHub).
 */
export async function getPlatformMetrics() {
  const rows = await query<CountRow>(`
    SELECT
      (SELECT COUNT(*)::text FROM "User") AS users,
      (SELECT COUNT(*)::text FROM "Listing") AS listings,
      (SELECT COUNT(*)::text FROM "Booking") AS bookings
  `);
  const row = rows[0];
  if (!row) {
    return { users: 0, listings: 0, bookings: 0 };
  }
  return {
    users: Number(row.users) || 0,
    listings: Number(row.listings) || 0,
    bookings: Number(row.bookings) || 0,
  };
}
