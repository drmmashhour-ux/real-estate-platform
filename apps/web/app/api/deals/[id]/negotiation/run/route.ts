import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireNegotiationCopilotV1 } from "@/lib/deals/payments-negotiation-feature-guard";
import { runNegotiationCopilot } from "@/modules/negotiation-copilot/negotiation.service";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireNegotiationCopilotV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  try {
    const result = await runNegotiationCopilot(dealId, auth.userId);
    return Response.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Run failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
