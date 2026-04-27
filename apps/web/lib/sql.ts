import type { QueryResultRow } from "pg";

/**
 * Order 84 / 81.1 — re-exports the shared SQL helpers; prefer `import { query } from "@/lib/db"`.
 */
export type { QueryResultRow };
export {
  classifySqlStatementKind,
  extractLeadingSqlCommentTag,
  pool,
  query,
  readOnlyQuery,
  ReadOnlyQueryError,
} from "./db";

/**
 * Example: CRM `Listing` joined to `User` (broker). Prisma table `Listing` has
 * no `@@map`, so the table is `"Listing"`; `userId` is stored as `user_id`;
 * marketplace visibility is `crm_marketplace_live` (not `active`).
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
