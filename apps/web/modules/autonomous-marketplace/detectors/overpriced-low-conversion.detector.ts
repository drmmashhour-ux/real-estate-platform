import type { ObservationSnapshot } from "../types/domain.types";
import { makeOpportunity, makeProposedAction } from "./detector-utils";
import type { AutonomyDetector } from "./detector.types";

export const overpricedLowConversionDetector: AutonomyDetector = {
  id: "overpriced_low_conversion",
  description: "Price above suggested band with weak conversion.",
  run(obs: ObservationSnapshot) {
    if (obs.target.type !== "fsbo_listing" || !obs.target.id) return [];

    const m = obs.facts;
    const priceCents = m.priceCents as number | undefined;
    const suggested = m.priceSuggestedCents as number | undefined;
    const views = obs.aggregates.views ?? 0;
    const contacts = obs.aggregates.contacts ?? 0;
    const rate = views > 0 ? contacts / views : 0;

    if (!priceCents || !suggested || priceCents <= suggested) return [];
    if (rate > 0.03) return [];

    const pa = makeProposedAction({
      type: "SUGGEST_PRICE_CHANGE",
      target: obs.target,
      detectorId: overpricedLowConversionDetector.id,
      opportunityId: "opp-op-1",
      confidence: 0.64,
      risk: "MEDIUM",
      title: "Price may exceed market absorption",
      explanation: "List price sits above advisory suggestion while engagement remains soft.",
      humanReadableSummary: "Recommend advisory decrease review — apply only via approved executor path.",
      metadata: { currentCents: priceCents, suggestedCents: suggested },
    });

    return [
      makeOpportunity({
        detectorId: overpricedLowConversionDetector.id,
        title: "Overpriced vs conversion",
        explanation: "Traffic exists but conversion is weak versus pricing guidance.",
        confidence: 0.63,
        risk: "MEDIUM",
        evidence: { conversionRate: rate, priceCents, suggested },
        actions: [pa],
      }),
    ];
  },
};
