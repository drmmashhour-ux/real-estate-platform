import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { dealAutopilotFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { logBrokerWorkspaceEvent, brokerWorkspaceAuditKeys } from "@/lib/broker/broker-workspace-audit";

export const dynamic = "force-dynamic";

/** Broker marks an assistive next-step as acknowledged — does not change legal deal status. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!dealAutopilotFlags.smartDealAutopilotV1) {
    return Response.json({ error: "Smart Deal Autopilot disabled" }, { status: 403 });
  }
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  let body: { actionId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const deal = await prisma.deal.findUnique({ where: { id: dealId }, select: { executionMetadata: true } });
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const meta =
    deal.executionMetadata && typeof deal.executionMetadata === "object"
      ? ({ ...(deal.executionMetadata as object) } as Record<string, unknown>)
      : {};
  const completed = Array.isArray(meta.autopilotCompletedActionIds)
    ? ([...(meta.autopilotCompletedActionIds as string[])] as string[])
    : [];
  if (body.actionId && !completed.includes(body.actionId)) {
    completed.push(body.actionId);
  }
  meta.autopilotCompletedActionIds = completed;
  meta.autopilotLastAckAt = new Date().toISOString();

  await prisma.deal.update({
    where: { id: dealId },
    data: { executionMetadata: meta as object },
  });

  await logBrokerWorkspaceEvent({
    actorUserId: auth.userId,
    actionKey: brokerWorkspaceAuditKeys.dealAutopilotNextStepComplete,
    dealId,
    payload: { actionId: body.actionId ?? null },
  });

  return Response.json({ ok: true });
}
