import { prisma } from "@/lib/db";

/**
 * Distinct (user, listing) pairs: viewed a stay (`search_events.VIEW`) in the window but no matching
 * in-window booking row in an active pipeline status — suitable for retargeting audience **volume** estimates.
 */
export async function countBnhubViewedNotBookedPairs(since: Date): Promise<number> {
  const rows = await prisma.$queryRaw<[{ c: bigint }]>`
    WITH v AS (
      SELECT DISTINCT se.listing_id, se.user_id
      FROM search_events se
      WHERE se.event_type = 'VIEW'
        AND se.created_at >= ${since}
        AND se.listing_id IS NOT NULL
        AND se.user_id IS NOT NULL
    ),
    bk AS (
      SELECT DISTINCT b.listing_id, b.guest_id AS user_id
      FROM "Booking" b
      WHERE b.created_at >= ${since}
        AND b.status::text IN (
          'PENDING',
          'CONFIRMED',
          'COMPLETED',
          'AWAITING_HOST_APPROVAL'
        )
    )
    SELECT COUNT(*)::bigint AS c
    FROM v
    LEFT JOIN bk ON v.listing_id = bk.listing_id AND v.user_id = bk.user_id
    WHERE bk.listing_id IS NULL
  `;
  return Number(rows[0]?.c ?? 0n);
}
