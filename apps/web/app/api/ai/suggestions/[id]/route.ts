import { getGuestId } from "@/lib/auth/session";
import { query } from "@/lib/sql";

export const dynamic = "force-dynamic";

type SuggestionRow = {
  id: string;
  runId: string;
  listingId: string;
  fieldType: string;
  currentValue: string | null;
  proposedValue: string | null;
  reason: string | null;
  riskLevel: string;
  confidenceScore: number;
  autoApplyAllowed: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * GET /api/ai/suggestions/:id
 * `id` is BNHub `ShortTermListing.id`. Returns the latest `listing_optimization_suggestions` rows
 * the authenticated host is allowed to see.
 */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: listingId } = await params;

  const rows = await query<SuggestionRow>(
    `SELECT
       s.id,
       s.run_id         AS "runId",
       s.listing_id     AS "listingId",
       s.field_type     AS "fieldType",
       s.current_value  AS "currentValue",
       s.proposed_value AS "proposedValue",
       s.reason         AS "reason",
       s.risk_level     AS "riskLevel",
       s.confidence_score AS "confidenceScore",
       s.auto_apply_allowed AS "autoApplyAllowed",
       s.status         AS "status",
       s.created_at     AS "createdAt",
       s.updated_at     AS "updatedAt"
     FROM "listing_optimization_suggestions" s
     INNER JOIN "bnhub_listings" l ON l.id = s.listing_id AND l.host_id = $1
     WHERE s.listing_id = $2
     ORDER BY s.created_at DESC
     LIMIT 10`,
    [userId, listingId]
  );

  return Response.json(rows);
}
