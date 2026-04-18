import {
  SUBMISSION_BURST_MIN_COUNT,
  SUBMISSION_BURST_WINDOW_MS,
} from "../legal-intelligence.constants";
import type { LegalIntelligenceSignal } from "../legal-intelligence.types";
import type { LegalDetector } from "./legal-detector.types";
import { stableSignalId } from "./legal-detector-utils";

export const highRiskSubmissionBurstDetector: LegalDetector = {
  id: "high_risk_submission_burst",
  run(snapshot): LegalIntelligenceSignal[] {
    const out: LegalIntelligenceSignal[] = [];
    const listingId = snapshot.fsboListingId ?? snapshot.entityId;
    const endMs = Date.parse(snapshot.builtAt);
    if (Number.isNaN(endMs)) return out;
    const startMs = endMs - SUBMISSION_BURST_WINDOW_MS;
    let n = 0;
    for (const d of snapshot.supportingDocuments) {
      const t = Date.parse(d.createdAt);
      if (!Number.isNaN(t) && t >= startMs && t <= endMs) n += 1;
    }
    if (n < SUBMISSION_BURST_MIN_COUNT) return out;

    out.push({
      id: stableSignalId(["high_risk_submission_burst", listingId]),
      signalType: "high_risk_submission_burst",
      severity: n >= SUBMISSION_BURST_MIN_COUNT + 4 ? "critical" : "warning",
      entityType: snapshot.entityType || "legal_workflow",
      entityId: listingId,
      actorType: snapshot.actorType || "unknown",
      workflowType: snapshot.workflowType || "unknown",
      observedAt: snapshot.builtAt,
      explanation:
        "Volume spike: supporting uploads created in a short interval exceed the configured burst threshold — allocate review capacity; not a determination of intent.",
      metadata: {
        uploadsInBurstWindow: n,
        windowMinutes: Math.round(SUBMISSION_BURST_WINDOW_MS / 60000),
      },
    });
    return out;
  },
};
