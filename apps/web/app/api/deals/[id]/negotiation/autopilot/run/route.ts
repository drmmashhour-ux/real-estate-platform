import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { dealAutopilotFlags } from "@/config/feature-flags";
import { requireNegotiationCopilotV1 } from "@/lib/deals/payments-negotiation-feature-guard";
import { runNegotiationAutopilotPersisted } from "@/modules/negotiation-autopilot/negotiation-autopilot.service";
import { logBrokerWorkspaceEvent, brokerWorkspaceAuditKeys } from "@/lib/broker/broker-workspace-audit";

export const dynamic = "force-dynamic";

/** Persists negotiation suggestions for approval workflow — requires base negotiation copilot flag. */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireNegotiationCopilotV1();
  if (gated) return gated;
  if (!dealAutopilotFlags.negotiationAutopilotAssistV1) {
    return Response.json({ error: "Negotiation autopilot assist disabled" }, { status: 403 });
  }
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const result = await runNegotiationAutopilotPersisted(dealId, auth.userId);
  await logBrokerWorkspaceEvent({
    actorUserId: auth.userId,
    actionKey: brokerWorkspaceAuditKeys.negotiationAutopilotRun,
    dealId,
    payload: { scenarioCount: result.scenarios.length },
  });
  return Response.json(result);
}
