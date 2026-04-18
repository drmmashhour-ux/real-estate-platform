import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireDealExecutionV1 } from "@/lib/deals/pipeline-feature-guard";
import { startExecution } from "@/modules/execution/execution.service";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireDealExecutionV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { id: true, brokerId: true, lecipmExecutionPipelineState: true },
  });
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const result = await startExecution({
    dealId,
    actorUserId: auth.userId,
    ctx: { deal, userId: auth.userId, role: auth.role },
  });
  if (!result.ok) {
    return Response.json({ error: result.message }, { status: 400 });
  }
  return Response.json({
    ok: true,
    disclaimer: "Execution prep on platform — broker must complete official steps in authorized environment.",
  });
}
