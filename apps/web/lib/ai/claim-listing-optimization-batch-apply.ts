import { pool } from "@/lib/sql";

export type ClaimManyListingOptimizationResult =
  | { ok: true; claimedIds: string[] }
  | { ok: false; status: 400 | 403 | 404 | 409; message: string };

/**
 * Claim many BNHub listing optimization rows in one transaction (same host + listing).
 * Sets `applied_at` only. Pair with `releaseListingOptimizationBatchClaims` if execute fails.
 * After successful {@link executeActions}, set `status: "applied"` via Prisma.
 */
export async function claimManyListingOptimizationsForApply(input: {
  suggestionIds: string[];
  userId: string;
  shortTermListingId: string;
}): Promise<ClaimManyListingOptimizationResult> {
  const { suggestionIds, userId, shortTermListingId } = input;
  const unique = Array.from(new Set(suggestionIds.filter(Boolean)));
  if (unique.length === 0) {
    return { ok: false, status: 400, message: "No suggestion ids" };
  }
  if (unique.length !== suggestionIds.length) {
    return { ok: false, status: 400, message: "Duplicate suggestion ids" };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const sel = await client.query<{
      id: string;
      listingId: string;
      hostId: string;
    }>(
      `SELECT s.id,
              s.listing_id AS "listingId",
              l.host_id AS "hostId"
         FROM listing_optimization_suggestions s
         INNER JOIN bnhub_listings l ON l.id = s.listing_id
        WHERE s.id = ANY($1::text[])`,
      [unique]
    );
    if (sel.rowCount === 0) {
      await client.query("ROLLBACK");
      return { ok: false, status: 404, message: "Suggestions not found" };
    }
    if (sel.rowCount !== unique.length) {
      await client.query("ROLLBACK");
      return { ok: false, status: 404, message: "Some suggestions not found" };
    }
    for (const row of sel.rows) {
      if (row.hostId !== userId) {
        await client.query("ROLLBACK");
        return { ok: false, status: 403, message: "Forbidden" };
      }
      if (row.listingId !== shortTermListingId) {
        await client.query("ROLLBACK");
        return { ok: false, status: 400, message: "Mismatched listing" };
      }
    }
    const upd = await client.query<{ id: string }>(
      `UPDATE listing_optimization_suggestions
         SET applied_at = NOW()
       WHERE id = ANY($1::text[]) AND applied_at IS NULL
   RETURNING id`,
      [unique]
    );
    if (upd.rowCount === 0) {
      await client.query("ROLLBACK");
      return { ok: false, status: 409, message: "Already applied" };
    }
    if (upd.rowCount !== unique.length) {
      await client.query("ROLLBACK");
      return { ok: false, status: 409, message: "Some suggestions were already applied" };
    }
    await client.query("COMMIT");
    return { ok: true, claimedIds: upd.rows.map((r) => r.id) };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/** Clears `applied_at` for ids so the host can retry (e.g. after `executeActions` error). */
export async function releaseListingOptimizationBatchClaims(suggestionIds: string[]): Promise<void> {
  if (suggestionIds.length === 0) return;
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE listing_optimization_suggestions
         SET applied_at = NULL
       WHERE id = ANY($1::text[])`,
      [suggestionIds]
    );
  } finally {
    client.release();
  }
}
