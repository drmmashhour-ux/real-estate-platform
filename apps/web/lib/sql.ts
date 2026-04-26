import type { QueryResultRow } from "pg";

import { pool } from "./db/index";

/**
 * Order 84 — analytics / join SQL: share the same `pg` `Pool` as `@/lib/db` (no second pool, no
 * manual `connect`/`release` per call — use `pool.query` for one-shot statements).
 * For Prisma CRUD, use `marketplaceDB` / `coreDB` / `monolithPrisma` from `@/lib/db`.
 * See `lib/db/hybrid-strategy.ts` for the strategy table and examples.
 */
export { pool };

/**
 * Parameterized query; returns result rows only (use `RETURNING` for inserts).
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  if (process.env.DB_SQL_LOG !== "0") {
    console.log("[SQL]", text, params);
  }
  try {
    const res =
      params === undefined
        ? await pool.query<T>(text)
        : await pool.query<T>(text, params);
    return res.rows;
  } catch (e) {
    console.error("[SQL ERROR]", e);
    throw e;
  }
}

/**
 * Example: CRM `Listing` joined to `User` (broker). Prisma table `Listing` has
 * no `@@map`, so the table is `"Listing"`; `userId` is stored as `user_id`;
 * marketplace visibility is `crm_marketplace_live` (not `active`).
 *
 * ```ts
 * import { query, listingWithOwnerEmailExample } from "@/lib/sql";
 * const rows = await query(...listingWithOwnerEmailExample());
 * ```
 */
export function listingWithOwnerEmailExample(): [string, unknown[]] {
  const sql = `
    SELECT l.id, l.listing_code, l.title, l.price, l.city, u.email AS owner_email
    FROM "Listing" l
    JOIN "User" u ON u.id = l.user_id
    WHERE l.crm_marketplace_live = true
    LIMIT 100
  `;
  return [sql.trim(), []];
}
