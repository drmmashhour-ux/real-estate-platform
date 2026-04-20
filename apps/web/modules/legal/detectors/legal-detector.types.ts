import type { LegalIntelligenceSignal } from "../legal-intelligence.types";
import type { LegalIntelligenceSnapshot } from "../legal-intelligence.types";

export type LegalDetectorId =
  | "duplicate_document"
  | "duplicate_identity"
  | "suspicious_resubmission"
  | "mismatched_actor_workflow"
  | "high_rejection_rate"
  | "missing_required_cluster"
  | "cross_entity_conflict"
  | "metadata_anomaly"
  | "review_delay_risk"
  | "high_risk_submission_burst"
  | "legal_record_compliance";

export type LegalDetector = {
  id: LegalDetectorId;
  run: (snapshot: LegalIntelligenceSnapshot) => LegalIntelligenceSignal[];
};
