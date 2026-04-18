import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { lecipmPaymentsNegotiationFlags } from "@/config/feature-flags";
import { getPpCpDiff } from "@/modules/negotiation-copilot/negotiation-diff.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!lecipmPaymentsNegotiationFlags.ppCpNegotiationBridgeV1 || !lecipmPaymentsNegotiationFlags.negotiationCopilotV1) {
    return Response.json({ error: "PP/CP negotiation bridge disabled" }, { status: 403 });
  }
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const diff = await getPpCpDiff(dealId);
  if (!diff) return Response.json({ error: "Deal not found" }, { status: 404 });
  return Response.json(diff);
}
