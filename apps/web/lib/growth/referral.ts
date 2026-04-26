import { query } from "@/lib/sql";

export function generateReferralCode(userId: string) {
  return `REF-${userId.slice(0, 6)}`;
}

async function countReferralsByCode(code: string): Promise<number> {
  const rows = await query<{ count: string | number }>(
    `SELECT COUNT(*)::int AS count FROM "Referral" WHERE "code" = $1`,
    [code]
  );
  const row = rows[0];
  if (!row) return 0;
  return typeof row.count === "number" ? row.count : Number(row.count);
}

/**
 * Records that `newUserId` signed up with `code` (e.g. from ?ref=).
 * Idempotent on `newUserId` (second insert for same user is ignored).
 * Optional reward hook: `referrals > 5` → `console.log('Reward user')` (Order 47).
 */
export async function trackReferral(code: string, newUserId: string) {
  const inserted = await query<{ id: string }>(
    `
    INSERT INTO "Referral" ("code", "newUserId", "createdAt")
    VALUES ($1, $2, NOW())
    ON CONFLICT ("newUserId") DO NOTHING
    RETURNING "id"
  `,
    [code, newUserId]
  );

  if (inserted.length === 0) {
    return;
  }

  const referrals = await countReferralsByCode(code);
  if (referrals > 5) {
    console.log("Reward user");
  }
}
