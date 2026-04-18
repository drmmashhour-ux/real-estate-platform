import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { findDealForParticipant } from "@/lib/deals/execution-access";
import { getGuestId } from "@/lib/auth/session";
import { dealTransactionFlags } from "@/config/feature-flags";
import { requireConditionTrackingV1 } from "@/lib/deals/pipeline-feature-guard";
import { listConditions, upsertCondition } from "@/modules/deal-execution/condition-tracker.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!dealTransactionFlags.conditionTrackingV1 && !dealTransactionFlags.clientDealViewV1) {
    return Response.json({ error: "Conditions disabled" }, { status: 403 });
  }
  const { id: dealId } = await context.params;
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const deal = await findDealForParticipant(dealId, userId);
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const conditions = await listConditions(dealId);
  return Response.json({ conditions });
}

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
