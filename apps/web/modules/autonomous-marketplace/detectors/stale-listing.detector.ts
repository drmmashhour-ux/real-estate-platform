import { autonomyConfig } from "../config/autonomy.config";
import type { ObservationSnapshot } from "../types/domain.types";
import { makeOpportunity, makeProposedAction } from "./detector-utils";
import type { AutonomyDetector } from "./detector.types";

export const staleListingDetector: AutonomyDetector = {
  id: "stale_listing",
  description: "Listing aged without meaningful refresh.",
  run(obs: ObservationSnapshot) {
    if (obs.target.type !== "fsbo_listing" || !obs.target.id) return [];

    const lp = obs.signals.find((s) => s.signalType === "listing_performance");
    const dom =
      lp && lp.signalType === "listing_performance"
        ? (lp.metadata.daysOnMarket ?? (obs.facts.daysOnMarket as number | undefined) ?? 0)
        : ((obs.facts.daysOnMarket as number | undefined) ?? 0);

    if (dom < autonomyConfig.detectors.staleListingDays) return [];

    const pa = makeProposedAction({
      type: "FLAG_REVIEW",
      target: obs.target,
      detectorId: staleListingDetector.id,
      opportunityId: "opp-stale-1",
      confidence: 0.68,
      risk: "LOW",
      title: "Stale listing — schedule refresh",
      explanation: `Listing has been live ~${dom} days without strong signals of momentum.`,
      humanReadableSummary: "Operator review: refresh photos, price narrative, or featured placement.",
      metadata: { daysOnMarket: dom },
    });

    return [
      makeOpportunity({
        detectorId: staleListingDetector.id,
        title: "Stale inventory signal",
        explanation: "Long time on market increases buyer skepticism.",
        confidence: 0.66,
        risk: "LOW",
        evidence: { daysOnMarket: dom },
        actions: [pa],
      }),
    ];
  },
};
