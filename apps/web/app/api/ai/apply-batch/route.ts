import { z } from "zod";
import { canAutoApply } from "@/lib/ai/autoApplyPolicy";
import { actionsFromOptimizationSuggestion } from "@/lib/ai/optimizationSuggestionActions";
import { monolithPrisma } from "@/lib/db";
import { executeActions, canExecute, type AutonomousAction } from "@/lib/ai/executor";
import { isDemoMode } from "@/lib/demo/isDemoMode";
import { getGuestId } from "@/lib/auth/session";
import { logError } from "@/lib/monitoring/errorLogger";
import { pool } from "@/lib/sql";

export const dynamic = "force-dynamic";

const BodyZ = z.object({ listingId: z.string().min(1) });

type Pair = { suggestionId: string; action: AutonomousAction };

type SuggestionRow = {
  id: string;
  field_type: string;
  current_value: string | null;
  proposed_value: string | null;
  reason: string | null;
};

function pickSafeAutoAction(suggestion: {
  id: string;
  fieldType: string;
  currentValue: string | null;
  proposedValue: string | null;
  reason: string | null;
}): Pair | null {
  const actions = actionsFromOptimizationSuggestion({
    id: suggestion.id,
    listingId: "",
    fieldType: suggestion.fieldType,
    currentValue: suggestion.currentValue,
    proposedValue: suggestion.proposedValue,
    reason: suggestion.reason,
  });
  for (const a of actions) {
    if (canAutoApply(a)) {
      return { suggestionId: suggestion.id, action: a as AutonomousAction };
    }
  }
  return null;
}

/**
 * Suggestion state is only marked `applied` **after** `executeActions` succeeds.
 * A dedicated session does `SELECT … FOR UPDATE` to serialize concurrent batch applies, then
 * `UPDATE` in the same session before `COMMIT` (execute still uses the normal app clients).
 */
export async function POST(req: Request) {
  if (isDemoMode) {
    return Response.json({ ok: true, applied: 0, demo: true });
  }
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch (e) {
    logError(e, { route: "/api/ai/apply-batch", phase: "parse_json" });
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const { listingId } = parsed.data;

  const st = await monolithPrisma.shortTermListing.findFirst({
    where: { id: listingId, ownerId: userId },
    select: { id: true },
  });
  if (!st) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const res = await client.query<SuggestionRow>(
      `SELECT s.id, s.field_type, s.current_value, s.proposed_value, s.reason
         FROM listing_optimization_suggestions s
         INNER JOIN bnhub_listings l ON l.id = s.listing_id
        WHERE s.listing_id = $1
          AND s.applied_at IS NULL
          AND s.status = 'suggested'
          AND l.host_id = $2
     ORDER BY s.created_at ASC
        FOR UPDATE OF s`,
      [listingId, userId]
    );

    const rows = res.rows;
    const pairs: Pair[] = [];
    for (const r of rows) {
      const p = pickSafeAutoAction({
        id: r.id,
        fieldType: r.field_type,
        currentValue: r.current_value,
        proposedValue: r.proposed_value,
        reason: r.reason,
      });
      if (p) pairs.push(p);
    }

    if (pairs.length === 0) {
      await client.query("COMMIT");
      return Response.json({ ok: true, applied: 0 });
    }

    if (!(await canExecute(listingId, pairs.length))) {
      await client.query("ROLLBACK");
      return Response.json(
        { error: "Rate limited: too many applies for this listing in the last hour" },
        { status: 429 }
      );
    }

    const safeActions = pairs.map((p) => p.action);
    const executeResult = await executeActions(safeActions, { shortTermListingId: listingId });

    if (executeResult !== "ok") {
      await client.query("ROLLBACK");
      const status = executeResult === "rate_limited" ? 429 : 200;
      return Response.json({ ok: false, applied: 0, executeResult }, { status });
    }

    const ids = pairs.map((p) => p.suggestionId);
    const upd = await client.query(
      `UPDATE listing_optimization_suggestions
          SET applied_at = NOW(),
              status = 'applied'::"ListingOptimizationSuggestionStatus",
              updated_at = NOW()
        WHERE id = ANY($1::text[])
          AND listing_id = $2
          AND applied_at IS NULL`,
      [ids, listingId]
    );
    if (upd.rowCount !== ids.length) {
      await client.query("ROLLBACK");
      console.error("[BATCH APPLY ERROR] post-execute mark mismatch", {
        expected: ids.length,
        got: upd.rowCount,
        listingId,
      });
      return Response.json({ error: "Failed to mark suggestions" }, { status: 500 });
    }

    await client.query("COMMIT");
    return Response.json({ ok: true, applied: ids.length, executeResult });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[BATCH APPLY ERROR]", e);
    logError(e, { route: "/api/ai/apply-batch", phase: "transaction" });
    return Response.json({ error: "Failed" }, { status: 500 });
  } finally {
    client.release();
  }
}
