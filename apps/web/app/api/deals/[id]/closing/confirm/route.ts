import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireClosingPipelineV1 } from "@/lib/deals/pipeline-feature-guard";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { confirmClosingExecution } from "@/modules/closing/closing-room.service";

export const dynamic = "force-dynamic";

/**
 * Broker-path closing confirm — aligns with `POST /api/closing/deals/[dealId]/confirm`.
 * Body: { closingDate?: ISO date string, notes?: string, action_pipeline_id?: string }
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireClosingPipelineV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  if (!canMutateExecution(auth.userId, auth.role, auth.deal)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const closingDateRaw =
    typeof body.closingDate === "string" ? body.closingDate : new Date().toISOString().slice(0, 10);
  const closingDate = new Date(closingDateRaw);
  if (Number.isNaN(closingDate.getTime())) {
    return Response.json({ error: "Invalid closingDate" }, { status: 400 });
  }

  const actionPipelineId =
    typeof body.action_pipeline_id === "string" && body.action_pipeline_id.trim()
      ? body.action_pipeline_id.trim()
      : null;

  try {
    const r = await confirmClosingExecution({
      dealId,
      actorUserId: auth.userId,
      closingDate,
      notes: typeof body.notes === "string" ? body.notes : null,
      actionPipelineId,
    });
    return Response.json({ ok: true, assetId: r.assetId });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
