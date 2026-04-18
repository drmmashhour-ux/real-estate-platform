import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { dealAutopilotFlags } from "@/config/feature-flags";
import { rejectSuggestion } from "@/modules/negotiation-copilot/negotiation.service";
import { logBrokerWorkspaceEvent, brokerWorkspaceAuditKeys } from "@/lib/broker/broker-workspace-audit";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string; scenarioId: string }> }) {
  if (!dealAutopilotFlags.negotiationAutopilotAssistV1) {
    return Response.json({ error: "Negotiation autopilot disabled" }, { status: 403 });
  }
  const { id: dealId, scenarioId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const updated = await rejectSuggestion({ dealId, suggestionId: scenarioId, actorUserId: auth.userId });
  await logBrokerWorkspaceEvent({
    actorUserId: auth.userId,
    actionKey: brokerWorkspaceAuditKeys.negotiationScenarioRejected,
    dealId,
    payload: { scenarioId },
  });
  return Response.json(updated);
}
