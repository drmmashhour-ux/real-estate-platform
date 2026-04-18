import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireNegotiationCopilotV1 } from "@/lib/deals/payments-negotiation-feature-guard";
import { getActiveThread, listSuggestions } from "@/modules/negotiation-copilot/negotiation-memory.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireNegotiationCopilotV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const [suggestions, thread] = await Promise.all([listSuggestions(dealId), getActiveThread(dealId)]);
  return Response.json({ suggestions, thread });
}
