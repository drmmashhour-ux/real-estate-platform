import { query } from "@/lib/sql";

/**
 * Persist a **suggested** nightly price in cents (audit; does not change listing or BNHub rows here).
 */
export async function proposePrice(
  listingId: string,
  suggestedPriceCents: number,
  reason: string
): Promise<void> {
  await query(
    `INSERT INTO "PriceSuggestion" ("id", "listingId", "suggestedPriceCents", "reason", "applied", "createdAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, false, NOW())`,
    [listingId, Math.round(suggestedPriceCents), reason]
  );
}
