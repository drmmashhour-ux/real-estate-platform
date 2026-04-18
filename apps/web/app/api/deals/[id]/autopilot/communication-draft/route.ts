import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { dealAutopilotFlags } from "@/config/feature-flags";
import { buildBrokerReviewableStatusDraft } from "@/modules/deal-autopilot/integrations/communication-hook.service";
import { logBrokerWorkspaceEvent, brokerWorkspaceAuditKeys } from "@/lib/broker/broker-workspace-audit";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!dealAutopilotFlags.smartDealAutopilotV1) {
    return Response.json({ error: "Smart Deal Autopilot disabled" }, { status: 403 });
  }
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const draft = await buildBrokerReviewableStatusDraft(dealId);
  await logBrokerWorkspaceEvent({
    actorUserId: auth.userId,
    actionKey: brokerWorkspaceAuditKeys.dealAutopilotCommunicationDraft,
    dealId,
    payload: { channel: draft.channel },
  });
  return Response.json(draft);
}
