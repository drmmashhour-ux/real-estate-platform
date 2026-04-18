/**
 * Alias for POST /api/deals/[id]/conditions — broker updates a condition row.
 */
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireConditionTrackingV1 } from "@/lib/deals/pipeline-feature-guard";
import { upsertCondition } from "@/modules/deal-execution/condition-tracker.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireConditionTrackingV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    id?: string;
    conditionType: string;
    deadline?: string | null;
    status?: string;
    relatedForm?: string | null;
    notes?: string | null;
  };
  if (!body.conditionType) {
    return Response.json({ error: "conditionType required" }, { status: 400 });
  }
  const deadline = body.deadline ? new Date(body.deadline) : null;
  const row = await upsertCondition({
    dealId,
    id: body.id,
    conditionType: body.conditionType,
    deadline,
    status: body.status,
    relatedForm: body.relatedForm,
    notes: body.notes,
  });
  return Response.json({ condition: row });
}
