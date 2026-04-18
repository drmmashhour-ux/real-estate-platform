import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { dealAutopilotFlags } from "@/config/feature-flags";
import { runNegotiationAutopilotAssist } from "@/modules/negotiation-autopilot/negotiation-autopilot.service";
import { logBrokerWorkspaceEvent, brokerWorkspaceAuditKeys } from "@/lib/broker/broker-workspace-audit";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!dealAutopilotFlags.negotiationAutopilotAssistV1 || !dealAutopilotFlags.ppCpScenarioBuilderV1) {
    return Response.json({ error: "Negotiation autopilot assist disabled" }, { status: 403 });
  }
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const result = await runNegotiationAutopilotAssist(dealId);
  await logBrokerWorkspaceEvent({
    actorUserId: auth.userId,
    actionKey: brokerWorkspaceAuditKeys.negotiationAutopilotViewed,
    dealId,
    payload: { scenarioCount: result.scenarios.length },
  });
  return Response.json(result);
}
