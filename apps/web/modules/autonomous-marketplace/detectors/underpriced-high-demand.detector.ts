import type { ObservationSnapshot } from "../types/domain.types";
import { makeOpportunity, makeProposedAction } from "./detector-utils";
import type { AutonomyDetector } from "./detector.types";

export const underpricedHighDemandDetector: AutonomyDetector = {
  id: "underpriced_high_demand",
  description: "Strong engagement scores with conservative pricing vs metrics suggestion.",
  run(obs: ObservationSnapshot) {
    if (obs.target.type !== "fsbo_listing" || !obs.target.id) return [];

    const m = obs.facts;
    const priceCents = m.priceCents as number | undefined;
    const suggested = m.priceSuggestedCents as number | undefined;
    const convScore = m.conversionScore as number | undefined;

    if (!priceCents || !suggested || convScore == null || convScore < 60) return [];
    if (suggested <= priceCents * 1.02) return [];

    const pa = makeProposedAction({
      type: "SUGGEST_PRICE_CHANGE",
      target: obs.target,
      detectorId: underpricedHighDemandDetector.id,
      opportunityId: "opp-up-1",
      confidence: 0.61,
      risk: "MEDIUM",
      title: "Demand suggests upward price band",
      explanation: "Metrics indicate healthy engagement while list price sits below suggested advisory band.",
      humanReadableSummary: "Surface advisory increase — requires human approval before any apply.",
      metadata: { currentCents: priceCents, suggestedCents: suggested, deltaPct: ((suggested - priceCents) / priceCents) * 100 },
    });

    return [
      makeOpportunity({
        detectorId: underpricedHighDemandDetector.id,
        title: "Underpriced vs demand",
        explanation: "Conversion quality high relative to price positioning.",
        confidence: 0.62,
        risk: "MEDIUM",
        evidence: { conversionScore: convScore, priceCents, suggested },
        actions: [pa],
      }),
    ];
  },
};
