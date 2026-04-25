import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { requireClosingPipelineV1 } from "@/lib/deals/pipeline-feature-guard";
import { FUND_MILESTONE_KINDS } from "@/modules/quebec-closing/quebec-closing-fund-flow";
import { upsertClosingFundMilestone, getQuebecClosingBundle } from "@/modules/quebec-closing/quebec-closing.service";

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

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const kind = typeof body.kind === "string" ? body.kind : "";
  if (!FUND_MILESTONE_KINDS.includes(kind as (typeof FUND_MILESTONE_KINDS)[number])) {
    return Response.json({ error: `kind must be one of: ${FUND_MILESTONE_KINDS.join(", ")}` }, { status: 400 });
  }

  const status = typeof body.status === "string" ? body.status : "";
  if (!status) {
    return Response.json({ error: "status required" }, { status: 400 });
  }

  try {
    await upsertClosingFundMilestone({
      dealId,
      actorUserId: auth.userId,
      kind,
      status,
      amountCents: typeof body.amountCents === "number" ? Math.round(body.amountCents) : body.amountCents === null ? null : undefined,
      expectedAt: typeof body.expectedAt === "string" ? body.expectedAt : body.expectedAt === null ? null : undefined,
      completedAt: typeof body.completedAt === "string" ? body.completedAt : body.completedAt === null ? null : undefined,
      notes: typeof body.notes === "string" ? body.notes : body.notes === null ? null : undefined,
    });
    const bundle = await getQuebecClosingBundle(dealId);
    return Response.json(bundle);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
