import { autonomyConfig } from "../config/autonomy.config";
import type { ObservationSnapshot } from "../types/domain.types";
import { makeOpportunity, makeProposedAction } from "./detector-utils";
import type { AutonomyDetector } from "./detector.types";

export const weakListingContentDetector: AutonomyDetector = {
  id: "weak_listing_content",
  description: "Thin title or description hurts trust and SEO.",
  run(obs: ObservationSnapshot) {
    if (obs.target.type !== "fsbo_listing" || !obs.target.id) return [];

    const lp = obs.signals.find((s) => s.signalType === "listing_performance");
    const descLen =
      lp && lp.signalType === "listing_performance" ? (lp.metadata.descriptionLen ?? 0) : 0;
    const titleLen =
      lp && lp.signalType === "listing_performance" ? (lp.metadata.titleLen ?? 0) : 0;

    if (descLen >= autonomyConfig.detectors.weakDescriptionMinChars && titleLen >= 12) return [];

    const pa = makeProposedAction({
      type: "UPDATE_LISTING_COPY",
      target: obs.target,
      detectorId: weakListingContentDetector.id,
      opportunityId: "opp-wc-1",
      confidence: 0.74,
      risk: "LOW",
      title: "Expand listing narrative",
      explanation: "Description or title is thinner than recommended minimum for conversion.",
      humanReadableSummary: "Draft richer copy highlighting location, condition, and next steps.",
      metadata: { titleLen, descriptionLen: descLen },
    });

    return [
      makeOpportunity({
        detectorId: weakListingContentDetector.id,
        title: "Weak listing content",
        explanation: "Content depth below platform guidance.",
        confidence: 0.73,
        risk: "LOW",
        evidence: { titleLen, descriptionLen: descLen },
        actions: [pa],
      }),
    ];
  },
};
