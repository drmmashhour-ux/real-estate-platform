import { query } from "@/lib/sql";

/**
 * Append-only attribution rows for growth analytics (Order 50).
 * `source` = channel label, e.g. `tiktok`, `referral`, `organic`, UTM token.
 */
export async function trackAcquisition(source: string, userId: string) {
  await query(
    `
    INSERT INTO "Acquisition" ("source", "userId", "createdAt")
    VALUES ($1, $2, NOW())
  `,
    [source, userId]
  );
}
