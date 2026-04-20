import {
  SUSPICIOUS_RESUBMISSION_CREATED_MIN,
  SUSPICIOUS_RESUBMISSION_REJECTED_MIN,
} from "../legal-intelligence.constants";
import type { LegalIntelligenceSignal } from "../legal-intelligence.types";
import type { LegalDetector } from "./legal-detector.types";
import { stableSignalId } from "./legal-detector-utils";

export const suspiciousResubmissionDetector: LegalDetector = {
  id: "suspicious_resubmission",
  run(snapshot): LegalIntelligenceSignal[] {
    const out: LegalIntelligenceSignal[] = [];
    const listingId = snapshot.fsboListingId ?? snapshot.entityId;
    const { aggregates: a } = snapshot;
    const tl = snapshot.timeline;
    const rejectedEff = tl ? Math.max(a.supportingRejectedInWindow, tl.rejectionEventsInWindow) : a.supportingRejectedInWindow;
    const createdEff = tl ? Math.max(a.supportingCreatedInWindow, tl.submissionEventsInWindow) : a.supportingCreatedInWindow;
    if (
      rejectedEff < SUSPICIOUS_RESUBMISSION_REJECTED_MIN ||
      createdEff < SUSPICIOUS_RESUBMISSION_CREATED_MIN
    ) {
      return out;
    }
    out.push({
      id: stableSignalId(["suspicious_resubmission", listingId]),
      signalType: "suspicious_resubmission_pattern",
      severity: "warning",
      entityType: snapshot.entityType || "legal_workflow",
      entityId: listingId,
      actorType: snapshot.actorType || "unknown",
      workflowType: snapshot.workflowType || "unknown",
      observedAt: snapshot.builtAt,
      explanation:
        "Upload activity metric: elevated rejected supporting-file count alongside elevated new upload count in the review window — reviewers should confirm requirements are understood.",
      metadata: {
        rejectedSupportingInWindow: rejectedEff,
        uploadsCreatedInWindow: createdEff,
      },
    });
    return out;
  },
};
