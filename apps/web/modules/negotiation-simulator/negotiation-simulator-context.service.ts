import { runOfferStrategy } from "@/modules/offer-strategy/offer-strategy.engine";
import { buildOfferStrategyContext } from "@/modules/offer-strategy/offer-strategy-context.service";
import type { NegotiationSimulatorContext } from "./negotiation-simulator.types";

type Params = { dealId: string; brokerId: string };

/**
 * Merges offer strategy + deal-closer derived data (via offer context) into simulator input. Never throws.
 */
export async function buildNegotiationSimulatorContext(params: Params): Promise<NegotiationSimulatorContext> {
  const base: NegotiationSimulatorContext = { dealId: params.dealId, brokerId: params.brokerId };
  try {
    const osc = await buildOfferStrategyContext(params);
    const s = runOfferStrategy(osc);
    const eng =
      typeof osc.engagementScore === "number" && Number.isFinite(osc.engagementScore)
        ? Math.max(0, Math.min(1, osc.engagementScore / 100))
        : null;
    return {
      dealId: osc.dealId,
      leadId: osc.leadId ?? null,
      conversationId: osc.conversationId ?? null,
      brokerId: osc.brokerId ?? null,
      clientId: osc.clientId ?? null,
      closingReadinessScore: typeof osc.closingReadinessScore === "number" ? osc.closingReadinessScore : null,
      offerReadinessScore: s.readiness.score,
      posture: s.posture.style,
      blockers: s.blockers,
      objections: osc.objections,
      competitiveRisk: s.competitiveRisk.level,
      urgencyLevel: osc.urgencyLevel ?? null,
      financingReadiness: osc.financingReadiness ?? "unknown",
      engagementScore: eng,
      silenceGapDays: osc.silenceGapDays ?? null,
      trustLevel: osc.trustLevel,
      visitCompleted: osc.visitCompleted,
      offerDiscussed: osc.offerDiscussed,
      clientMemory: osc.clientMemory,
      priceSensitivity: osc.priceSensitivity,
      postponementHint: Boolean(osc.competitiveSignals?.delayedDecision) || Boolean(osc.hesitationOrComparisonHint),
    };
  } catch {
    return base;
  }
}
