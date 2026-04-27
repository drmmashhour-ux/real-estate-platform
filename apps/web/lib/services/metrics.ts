import { readOnlyQuery } from "@/lib/db";

type CountRow = {
  users: string;
  listings: string;
  bookings: string;
  users_7d: string;
  users_30d: string;
};

export type PlatformMetrics = {
  users: number;
  listings: number;
  bookings: number;
  users7d: number;
  users30d: number;
};

/**
 * High-level platform counts for investor / demo dashboards. Uses a single round-trip SQL aggregation.
 * Tables: monolith `User`, `Listing` (CRM), `Booking` (BNHub); user cohorts on `User.createdAt`.
 */
export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const rows = await readOnlyQuery<CountRow>(`
    /* service:platform-metrics */
    SELECT
      (SELECT COUNT(*)::text FROM "User") AS users,
      (SELECT COUNT(*)::text FROM "Listing") AS listings,
      (SELECT COUNT(*)::text FROM "Booking") AS bookings,
      (SELECT COUNT(*)::text FROM "User" WHERE "createdAt" > NOW() - interval '7 days') AS users_7d,
      (SELECT COUNT(*)::text FROM "User" WHERE "createdAt" > NOW() - interval '30 days') AS users_30d
  `);
  const row = rows[0];
  if (!row) {
    return { users: 0, listings: 0, bookings: 0, users7d: 0, users30d: 0 };
  }
  return {
    users: Number(row.users) || 0,
    listings: Number(row.listings) || 0,
    bookings: Number(row.bookings) || 0,
    users7d: Number(row.users_7d) || 0,
    users30d: Number(row.users_30d) || 0,
  };
}
