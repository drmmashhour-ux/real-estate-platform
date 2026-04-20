import {
  HIGH_REJECTION_RATE_MIN_REJECTED,
  HIGH_REJECTION_RATE_RATIO_THRESHOLD,
} from "../legal-intelligence.constants";
import type { LegalIntelligenceSignal } from "../legal-intelligence.types";
import type { LegalDetector } from "./legal-detector.types";
import { stableSignalId } from "./legal-detector-utils";

export const highRejectionRateDetector: LegalDetector = {
  id: "high_rejection_rate",
  run(snapshot): LegalIntelligenceSignal[] {
    const out: LegalIntelligenceSignal[] = [];
    const listingId = snapshot.fsboListingId ?? snapshot.entityId;
    const tl = snapshot.timeline;
    const totalRaw = snapshot.aggregates.supportingTotalInWindow;
    const rejectedRaw = snapshot.aggregates.supportingRejectedInWindow;
    const rejected = tl ? Math.max(rejectedRaw, tl.rejectionEventsInWindow) : rejectedRaw;
    const total = Math.max(totalRaw, rejected);
    if (total <= 0 || rejected < HIGH_REJECTION_RATE_MIN_REJECTED) return out;
    const ratio = rejected / total;
    if (ratio < HIGH_REJECTION_RATE_RATIO_THRESHOLD) return out;

    out.push({
      id: stableSignalId(["high_rejection_rate", listingId]),
      signalType: "high_rejection_rate",
      severity: ratio >= 0.65 ? "critical" : "warning",
      entityType: snapshot.entityType || "legal_workflow",
      entityId: listingId,
      actorType: snapshot.actorType || "unknown",
      workflowType: snapshot.workflowType || "unknown",
      observedAt: snapshot.builtAt,
      explanation:
        "Operational ratio: rejected supporting uploads exceed the configured fraction of uploads in-window — prioritize clarifying submission requirements.",
      metadata: {
        rejected,
        totalSupportingInWindow: total,
        ratioRounded: Math.round(ratio * 1000) / 1000,
      },
    });
    return out;
  },
};
