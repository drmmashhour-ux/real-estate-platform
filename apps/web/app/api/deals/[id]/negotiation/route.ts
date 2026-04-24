import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireNegotiationCopilotV1 } from "@/lib/deals/payments-negotiation-feature-guard";
import { getActiveThread, listSuggestions } from "@/modules/negotiation-copilot/negotiation-memory.service";
import {
  createNegotiationStrategiesForDeal,
  listLatestNegotiationStrategyRun,
} from "@/modules/deal/negotiation-strategy.service";

export const dynamic = "force-dynamic";

const NEGOTIATION_AI_DISCLAIMER =
  "AI suggests only — a licensed broker must review, modify as needed, and approve before any counter-offer is sent. Nothing here is auto-transmitted to a counterparty.";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireNegotiationCopilotV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const [suggestions, thread, strategyRun] = await Promise.all([
    listSuggestions(dealId),
    getActiveThread(dealId),
    listLatestNegotiationStrategyRun(dealId),
  ]);
  return Response.json({
    suggestions,
    thread,
    negotiationStrategies: strategyRun.strategies,
    strategyRunId: strategyRun.strategyRunId,
    negotiationAiDisclaimer: NEGOTIATION_AI_DISCLAIMER,
  });
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireNegotiationCopilotV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const deal = auth.deal;
  if (deal.status === "closed" || deal.status === "cancelled") {
    return Response.json({ error: "Deal is terminal — negotiation strategies are not regenerated." }, { status: 409 });
  }

  try {
    const { strategyRunId, strategies } = await createNegotiationStrategiesForDeal(dealId);
    return Response.json({
      ok: true,
      disclaimer: NEGOTIATION_AI_DISCLAIMER,
      strategyRunId,
      strategies,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to generate strategies";
    return Response.json({ error: msg }, { status: 500 });
  }
}
