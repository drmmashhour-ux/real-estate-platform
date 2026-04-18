import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { dealAutopilotFlags } from "@/config/feature-flags";
import { listNegotiationScenariosFromDb } from "@/modules/negotiation-autopilot/negotiation-autopilot.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!dealAutopilotFlags.negotiationAutopilotAssistV1) {
    return Response.json({ error: "Negotiation autopilot disabled" }, { status: 403 });
  }
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const scenarios = await listNegotiationScenariosFromDb(dealId);
  return Response.json({ scenarios });
}
