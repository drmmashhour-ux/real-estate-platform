/** When `1`, `import { db, prisma } from "@/lib/db"` uses `@repo/db-core` instead of `@repo/db` (gradual rollout). */
export const USE_NEW_DB = process.env.USE_NEW_DB === "1";

/**
 * Order 91 — opt into the split marketplace Prisma client for code paths that support both monolith
 * and `@repo/db-marketplace` (e.g. `const client = USE_MARKETPLACE_DB ? marketplacePrisma : monolithPrisma` where types allow).
 * Instant rollback: unset or `0` in production.
 */
export const USE_MARKETPLACE_DB = process.env.USE_MARKETPLACE_DB === "1";
