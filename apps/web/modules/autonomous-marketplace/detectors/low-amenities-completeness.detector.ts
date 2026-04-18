import type { ObservationSnapshot } from "../types/domain.types";
import { makeOpportunity, makeProposedAction } from "./detector-utils";
import type { AutonomyDetector } from "./detector.types";

export const lowAmenitiesCompletenessDetector: AutonomyDetector = {
  id: "low_amenities_completeness",
  description: "Experience tags / amenities shallow — filters miss the listing.",
  run(obs: ObservationSnapshot) {
    if (obs.target.type !== "fsbo_listing" || !obs.target.id) return [];

    const lp = obs.signals.find((s) => s.signalType === "listing_performance");
    const amenitiesScore =
      lp && lp.signalType === "listing_performance" ? (lp.metadata.amenitiesScore ?? 0) : 0;

    if (amenitiesScore >= 3) return [];

    const pa = makeProposedAction({
      type: "UPDATE_LISTING_COPY",
      target: obs.target,
      detectorId: lowAmenitiesCompletenessDetector.id,
      opportunityId: "opp-am-1",
      confidence: 0.66,
      risk: "LOW",
      title: "Complete amenities & experience tags",
      explanation: "Sparse amenity signals reduce match quality in search and ranking.",
      humanReadableSummary: "Add structured amenities matching how buyers filter inventory.",
      metadata: { amenitiesScore },
    });

    return [
      makeOpportunity({
        detectorId: lowAmenitiesCompletenessDetector.id,
        title: "Low amenities completeness",
        explanation: "Listing under-tagged versus buyer filter expectations.",
        confidence: 0.65,
        risk: "LOW",
        evidence: { amenitiesScore },
        actions: [pa],
      }),
    ];
  },
};
