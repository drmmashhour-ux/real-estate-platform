import { autonomyConfig } from "../config/autonomy.config";
import type { ObservationSnapshot } from "../types/domain.types";
import { makeOpportunity, makeProposedAction } from "./detector-utils";
import type { AutonomyDetector } from "./detector.types";

export const lowPhotoQualityOrCountDetector: AutonomyDetector = {
  id: "low_photo_quality_or_count",
  description: "Photo count below trust threshold.",
  run(obs: ObservationSnapshot) {
    if (obs.target.type !== "fsbo_listing" || !obs.target.id) return [];

    const lp = obs.signals.find((s) => s.signalType === "listing_performance");
    const photoCount =
      lp && lp.signalType === "listing_performance" ? (lp.metadata.photoCount ?? 0) : 0;

    if (photoCount >= autonomyConfig.detectors.minPhotosWarn) return [];

    const pa = makeProposedAction({
      type: "CREATE_TASK",
      target: obs.target,
      detectorId: lowPhotoQualityOrCountDetector.id,
      opportunityId: "opp-ph-1",
      confidence: 0.77,
      risk: "LOW",
      title: "Add photos to build trust",
      explanation: `Only ${photoCount} photos detected — buyers bounce when visual proof is thin.`,
      humanReadableSummary: "Internal task to upload additional angles and staging shots.",
      metadata: { photoCount, minRecommended: autonomyConfig.detectors.minPhotosStrong },
    });

    return [
      makeOpportunity({
        detectorId: lowPhotoQualityOrCountDetector.id,
        title: "Insufficient photography",
        explanation: "Visual proof below marketplace baseline.",
        confidence: 0.76,
        risk: "LOW",
        evidence: { photoCount },
        actions: [pa],
      }),
    ];
  },
};
