import type { LegalIntelligenceSnapshot } from "../legal-intelligence.types";
import type { LegalIntelligenceSignal } from "../legal-intelligence.types";
import { crossEntityConflictDetector } from "./cross-entity-conflict.detector";
import { duplicateDocumentDetector } from "./duplicate-document.detector";
import { duplicateIdentityDetector } from "./duplicate-identity.detector";
import { highRejectionRateDetector } from "./high-rejection-rate.detector";
import { highRiskSubmissionBurstDetector } from "./high-risk-submission-burst.detector";
import { metadataAnomalyDetector } from "./metadata-anomaly.detector";
import { mismatchedActorWorkflowDetector } from "./mismatched-actor-workflow.detector";
import { missingRequiredClusterDetector } from "./missing-required-cluster.detector";
import type { LegalDetector } from "./legal-detector.types";
import { reviewDelayRiskDetector } from "./review-delay-risk.detector";
import { suspiciousResubmissionDetector } from "./suspicious-resubmission.detector";

/** Fixed order — deterministic evaluation. */
export const legalDetectorRegistry: LegalDetector[] = [
  duplicateDocumentDetector,
  duplicateIdentityDetector,
  suspiciousResubmissionDetector,
  mismatchedActorWorkflowDetector,
  highRejectionRateDetector,
  missingRequiredClusterDetector,
  crossEntityConflictDetector,
  metadataAnomalyDetector,
  reviewDelayRiskDetector,
  highRiskSubmissionBurstDetector,
];

export function runLegalDetectors(snapshot: LegalIntelligenceSnapshot): LegalIntelligenceSignal[] {
  const acc: LegalIntelligenceSignal[] = [];
  for (const d of legalDetectorRegistry) {
    try {
      acc.push(...d.run(snapshot));
    } catch {
      /* deterministic path should not throw; swallow to preserve safety */
    }
  }
  return acc;
}
