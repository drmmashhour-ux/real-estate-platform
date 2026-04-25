import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { requireClosingPipelineV1 } from "@/lib/deals/pipeline-feature-guard";
import { applyQuebecConditionsUpdate } from "@/modules/quebec-closing/quebec-closing.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireClosingPipelineV1();
  if (gated) return gated;

  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;
  if (!canMutateExecution(auth.userId, auth.role, auth.deal)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { items?: unknown[] } = {};
  try {
    body = (await request.json()) as { items?: unknown[] };
  } catch {
    body = {};
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items: Array<{
    id?: string;
    conditionType: string;
    deadline: string;
    status?: string;
    notes?: string | null;
    relatedForm?: string | null;
  }> = [];

  for (const r of rawItems) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const conditionType = typeof o.conditionType === "string" ? o.conditionType : "";
    const deadline = typeof o.deadline === "string" ? o.deadline : "";
    if (!conditionType || !deadline) continue;
    items.push({
      id: typeof o.id === "string" ? o.id : undefined,
      conditionType,
      deadline,
      status: typeof o.status === "string" ? o.status : undefined,
      notes: typeof o.notes === "string" ? o.notes : o.notes === null ? null : undefined,
      relatedForm: typeof o.relatedForm === "string" ? o.relatedForm : o.relatedForm === null ? null : undefined,
    });
  }

  if (items.length === 0) {
    return Response.json({ error: "items[] required with conditionType and deadline" }, { status: 400 });
  }

  try {
    const bundle = await applyQuebecConditionsUpdate({
      dealId,
      actorUserId: auth.userId,
      items,
    });
    return Response.json(bundle);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
