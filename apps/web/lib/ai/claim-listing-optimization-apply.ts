import { pool } from "@/lib/sql";

export type ClaimListingOptimizationResult =
  | { ok: true }
  | { ok: false; status: 400 | 403 | 404 | 409; message: string };

/**
 * Transactional claim: sets `applied_at` once; validates host + listing match (BNHub).
 * Call **before** {@link executeActions} for `POST /api/ai/apply` with `suggestionId`.
 */
export async function claimListingOptimizationForApply(input: {
  suggestionId: string;
  userId: string;
  shortTermListingId: string;
}): Promise<ClaimListingOptimizationResult> {
  const { suggestionId, userId, shortTermListingId } = input;
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
        WHERE s.id = $1`,
      [suggestionId]
    );
    if (sel.rowCount === 0) {
      await client.query("ROLLBACK");
      return { ok: false, status: 404, message: "Suggestion not found" };
    }
    const row = sel.rows[0]!;
    if (row.hostId !== userId) {
      await client.query("ROLLBACK");
      return { ok: false, status: 403, message: "Forbidden" };
    }
    if (row.listingId !== shortTermListingId) {
      await client.query("ROLLBACK");
      return { ok: false, status: 400, message: "Mismatched listing" };
    }
    const upd = await client.query(
      `UPDATE listing_optimization_suggestions
         SET applied_at = NOW()
       WHERE id = $1 AND applied_at IS NULL
   RETURNING id`,
      [suggestionId]
    );
    if (upd.rowCount === 0) {
      await client.query("ROLLBACK");
      return { ok: false, status: 409, message: "Already applied" };
    }
    await client.query("COMMIT");
    return { ok: true };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
