import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireNegotiationCopilotV1 } from "@/lib/deals/payments-negotiation-feature-guard";
import { assertBrokerCanApproveNegotiation } from "@/modules/negotiation-copilot/approval-gate.service";
import { rejectSuggestion } from "@/modules/negotiation-copilot/negotiation.service";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string; suggestionId: string }> }) {
  const gated = requireNegotiationCopilotV1();
  if (gated) return gated;
  const { id: dealId, suggestionId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const gate = assertBrokerCanApproveNegotiation(auth.userId, auth.role, auth.deal);
  if (!gate.ok) return Response.json({ error: gate.message }, { status: 403 });

  const updated = await rejectSuggestion({ dealId, suggestionId, actorUserId: auth.userId });
  return Response.json({ suggestion: updated });
}
