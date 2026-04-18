import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireClosingPipelineV1 } from "@/lib/deals/pipeline-feature-guard";
import { prisma } from "@/lib/db";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { confirmDealClosing } from "@/modules/closing/closing.service";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireClosingPipelineV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  if (!canMutateExecution(auth.userId, auth.role, auth.deal)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { lecipmExecutionPipelineState: true, brokerId: true },
  });
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const r = await confirmDealClosing({
    dealId,
    actorUserId: auth.userId,
    ctx: {
      deal: { id: dealId, brokerId: deal.brokerId, lecipmExecutionPipelineState: deal.lecipmExecutionPipelineState },
      userId: auth.userId,
      role: auth.role,
    },
  });

  if (!r.ok) return Response.json({ error: r.message }, { status: 400 });
  return Response.json({ ok: true });
}
