import { query } from "@/lib/sql";

/**
 * Persists a combined suggestions blob (quality + optional dynamic pricing decision). Audit-only — no field updates.
 */
export async function saveOptimization(
  listingId: string,
  suggestions: Record<string, unknown>
): Promise<void> {
  await query(
    `INSERT INTO "ListingOptimization" ("id", "listingId", "suggestions", "createdAt", "applied")
     VALUES (gen_random_uuid()::text, $1, $2::jsonb, NOW(), false)`,
    [listingId, JSON.stringify(suggestions)]
  );
}
