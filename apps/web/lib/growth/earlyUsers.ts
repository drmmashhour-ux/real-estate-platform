import { CACHE_KEYS, clearCache, getCached } from "@/lib/cache";
import { query } from "@/lib/sql";

/**
 * First-100 / early traction cohort (Order 44). One row per user; idempotent.
 * Clears the public count cache so the next read reflects the write.
 */
export async function trackEarlyUser(userId: string) {
  await query(
    `
    INSERT INTO "EarlyUser" ("userId", "createdAt")
    VALUES ($1, NOW())
    ON CONFLICT ("userId") DO NOTHING
  `,
    [userId]
  );
  clearCache(CACHE_KEYS.earlyUsersCount);
}

async function getEarlyUserCountFromDb(): Promise<number> {
  const rows = await query<{ count: string | number }>(
    `SELECT COUNT(*)::int AS count FROM "EarlyUser"`
  );
  const row = rows[0];
  if (!row) return 0;
  return typeof row.count === "number" ? row.count : Number(row.count);
}

/** Cached aggregate (10s TTL, Order 73.2). */
export async function getEarlyUserCount() {
  return getCached(CACHE_KEYS.earlyUsersCount, 10, getEarlyUserCountFromDb);
}

/** Same as `getEarlyUserCount` (kept for existing imports). */
export async function getEarlyUserCountCached() {
  return getEarlyUserCount();
}
