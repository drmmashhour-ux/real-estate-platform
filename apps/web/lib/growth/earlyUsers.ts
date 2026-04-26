import { query } from "@/lib/sql";

/**
 * First-100 / early traction cohort (Order 44). One row per user; idempotent.
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
}

export async function getEarlyUserCount() {
  const rows = await query<{ count: string | number }>(
    `SELECT COUNT(*)::int AS count FROM "EarlyUser"`
  );
  const row = rows[0];
  if (!row) return 0;
  return typeof row.count === "number" ? row.count : Number(row.count);
}
