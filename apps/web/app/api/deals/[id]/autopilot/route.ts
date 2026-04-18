import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { dealAutopilotFlags } from "@/config/feature-flags";
import { loadDealForAutopilot } from "@/modules/deal-autopilot/deal-autopilot.service";
import { runDealAutopilotEngine } from "@/modules/deal-autopilot/deal-autopilot.engine";
import { logBrokerWorkspaceEvent, brokerWorkspaceAuditKeys } from "@/lib/broker/broker-workspace-audit";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!dealAutopilotFlags.smartDealAutopilotV1) {
    return Response.json({ error: "Smart Deal Autopilot disabled" }, { status: 403 });
  }
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const deal = await loadDealForAutopilot(dealId);
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const snapshot = runDealAutopilotEngine(deal);
  await logBrokerWorkspaceEvent({
    actorUserId: auth.userId,
    actionKey: brokerWorkspaceAuditKeys.dealAutopilotViewed,
    dealId,
    payload: { dealHealth: snapshot.dealHealth },
  });

  return Response.json(snapshot);
}
