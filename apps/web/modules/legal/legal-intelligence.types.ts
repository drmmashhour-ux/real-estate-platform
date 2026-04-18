/**
 * Legal Intelligence Phase 4 — domain types only (no business logic).
 * Advisory / audit-oriented; wording in UI must avoid accusatory conclusions.
 */

export type LegalIntelligenceSignalType =
  | "duplicate_document"
  | "duplicate_identity"
  | "suspicious_resubmission_pattern"
  | "mismatched_actor_workflow"
  | "high_rejection_rate"
  | "missing_required_cluster"
  | "cross_entity_conflict"
  | "metadata_anomaly"
  | "review_delay_risk"
  | "high_risk_submission_burst";

export type LegalIntelligenceSeverity = "info" | "warning" | "critical";

export type LegalIntelligenceSignal = {
  id: string;
  signalType: LegalIntelligenceSignalType;
  severity: LegalIntelligenceSeverity;
  /** Stable category for dashboards (e.g. entity:fsbo_listing). */
  entityType: string;
  entityId: string;
  /** Who triggered the workflow context when known (e.g. seller, broker). */
  actorType: string;
  /** Workflow or surface (e.g. fsbo_seller_documents). */
  workflowType: string;
  observedAt: string;
  explanation: string;
  /** Small structured payload for audit (counts, thresholds, keys) — no raw file bytes. */
  metadata: Record<string, string | number | boolean | null>;
};

export type LegalDocumentRow = {
  id: string;
  source: "fsbo_slot";
  docType: string;
  fileName: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  fsboListingId: string;
};

export type LegalSupportingDocRow = {
  id: string;
  userId: string;
  fsboListingId: string;
  originalFileName: string;
  mimeType: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type LegalVerificationCaseRow = {
  id: string;
  entityType: string;
  entityId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  overallScore: number | null;
  identitySignalCount: number;
};

export type LegalIntelligenceSnapshot = {
  builtAt: string;
  windowStart: string;
  windowEnd: string;
  entityType: string;
  entityId: string;
  actorType: string;
  workflowType: string;
  fsboListingId: string | null;
  ownerUserId: string | null;
  listingOwnerType: string | null;
  listingStatus: string | null;
  moderationStatus: string | null;
  documents: LegalDocumentRow[];
  supportingDocuments: LegalSupportingDocRow[];
  /** Same seller, other listings — metadata only for cross-listing determinism checks. */
  supportingDocumentsSameUserOtherListings: LegalSupportingDocRow[];
  verificationCases: LegalVerificationCaseRow[];
  aggregates: {
    supportingRejectedInWindow: number;
    supportingPendingInWindow: number;
    supportingCreatedInWindow: number;
    supportingTotalInWindow: number;
    slotRejectedCount: number;
    slotPendingReviewCount: number;
    slotMissingCriticalCount: number;
  };
};

export type LegalReviewPriorityLevel = "low" | "normal" | "high" | "urgent";

export type LegalReviewPriorityScore = {
  score: number;
  level: LegalReviewPriorityLevel;
  reasons: string[];
};

/**
 * Operational label: pattern that may warrant review — not a finding of wrongdoing.
 */
export type LegalFraudIndicator = {
  id: string;
  entityType: string;
  entityId: string;
  label: string;
  explanation: string;
  severity: LegalIntelligenceSeverity;
  relatedSignalTypes: LegalIntelligenceSignalType[];
  observedAt: string;
};

export type LegalAnomalyIndicator = {
  id: string;
  entityType: string;
  entityId: string;
  anomalyKind: LegalIntelligenceSignalType;
  explanation: string;
  severity: LegalIntelligenceSeverity;
  observedAt: string;
};

export type LegalQueueItemScore = {
  itemId: string;
  entityType: string;
  entityId: string;
  label: string;
  score: number;
  level: LegalReviewPriorityLevel;
  reasons: string[];
  submittedAt: string;
};

export type LegalIntelligenceSummary = {
  builtAt: string;
  entityType: string;
  entityId: string;
  countsBySeverity: Record<LegalIntelligenceSeverity, number>;
  countsBySignalType: Partial<Record<LegalIntelligenceSignalType, number>>;
  totalSignals: number;
  topAnomalyKinds: Array<{ kind: LegalIntelligenceSignalType; count: number }>;
  topFraudIndicatorLabels: Array<{ label: string; count: number }>;
  freshnessNote: string;
};

export type LegalReviewQueueItemInput = {
  id: string;
  entityType: string;
  entityId: string;
  workflowType: string;
  /** ISO time of last submission / upload / state change driving review. */
  submittedAt: string;
  label: string;
  readinessScore?: number;
  missingCriticalRequirements?: number;
  priorRejections?: number;
  enforcementBlocking?: boolean;
  downstreamBlocked?: boolean;
  workflowSensitivity?: "low" | "medium" | "high";
  /** When known from per-entity intelligence (multi-queue batch). */
  criticalSignals?: number;
  warningSignals?: number;
};
