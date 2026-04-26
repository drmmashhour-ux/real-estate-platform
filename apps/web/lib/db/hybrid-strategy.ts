/**
 * Order 84 — **Hybrid data access** (Prisma for CRUD, SQL for heavy reads).
 *
 * | Use case | Use |
 * |----------|-----|
 * | Create / read / update / delete, transactions, `where` filters | `marketplaceDB`, `coreDB`, or `monolithPrisma` from `@/lib/db` |
 * | Cross-table aggregations, large joins, analytics, reporting | `pool` (see {@link import('@/lib/sql').query}) or `queryWithRetry` / `safeQuery` in `lib/db-safe.ts` |
 *
 * For marketplace split (`@repo/db-marketplace`) the physical tables are `listings` and `bookings`
 * (see `prisma` schema), not the Prisma model names `Listing` / `Booking` in raw SQL.
 *
 * @example Prisma (CRUD)
 * ```ts
 * import { marketplaceDB } from "@/lib/db";
 * await marketplaceDB.booking.create({ data: { ... } });
 * ```
 *
 * @example SQL (analytics-style join) — `GROUP BY` must list selected non-aggregates (Postgres)
 * ```ts
 * import { query } from "@/lib/sql";
 * import { MARKETPLACE_LISTINGS_WITH_BOOKING_COUNT_EXAMPLE } from "@/lib/db/hybrid-strategy";
 * const rows = await query(MARKETPLACE_LISTINGS_WITH_BOOKING_COUNT_EXAMPLE);
 * ```
 * Prefer bound parameters for any user input (`query(text, [a, b])`).
 */
export const MARKETPLACE_LISTINGS_WITH_BOOKING_COUNT_EXAMPLE = `
  SELECT l.id, l.title, COUNT(b.id) AS booking_count
  FROM "listings" l
  LEFT JOIN "bookings" b ON b.listing_id = l.id
  GROUP BY l.id, l.title
`.trim();
