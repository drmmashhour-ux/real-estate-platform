/**
 * Legal Hub domain types — workflow guidance and compliance status only (not legal advice).
 */

export type LegalHubActorType =
  | "buyer"
  | "seller"
  | "landlord"
  | "tenant"
  | "broker"
  | "host"
  | "admin";

export type LegalWorkflowType =
  | "purchase_offer"
  | "seller_disclosure"
  | "lease_agreement"
  | "short_term_rental_compliance"
  | "broker_mandate"
  | "tenant_screening_consent"
  | "privacy_consent"
  | "identity_verification"
  | "payment_terms"
  | "property_rules"
  | "risk_acknowledgement";

export type LegalRequirementStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "approved"
  | "rejected"
  | "waived";

export type LegalRiskSeverity = "info" | "warning" | "critical";

/** Single requirement definition inside a workflow catalog. */
export interface LegalRequirementDefinition {
  id: string;
  label: string;
  description: string;
  /** When set, limits visibility of this step to these actors (empty = all workflow actors). */
  primaryActors?: LegalHubActorType[];
}

export interface LegalRecommendedDocument {
  id: string;
  label: string;
  detail?: string;
}

export interface LegalWorkflowDefinition {
  id: string;
  type: LegalWorkflowType;
  title: string;
  shortDescription: string;
  actors: LegalHubActorType[];
  /** Primary jurisdiction label; "QC" = Québec-oriented copy, expandable later. */
  jurisdiction?: string;
  requirements: LegalRequirementDefinition[];
  recommendedDocuments: LegalRecommendedDocument[];
  disclaimerText: string;
  brokerOrAdminReviewRequired: boolean;
}

/** Runtime state for one requirement instance. */
export interface LegalRequirementState {
  workflowType: LegalWorkflowType;
  requirementId: string;
  status: LegalRequirementStatus;
  updatedAt?: string;
  notes?: string;
}

export interface LegalWorkflowState {
  workflowType: LegalWorkflowType;
  title: string;
  shortDescription: string;
  completionPercent: number;
  currentPendingRequirementId: string | null;
  nextRequiredAction: string | null;
  requirements: Array<{
    definition: LegalRequirementDefinition;
    state: LegalRequirementStatus;
    updatedAt?: string;
  }>;
  brokerOrAdminReviewRequired: boolean;
}

export interface LegalRiskItem {
  id: string;
  severity: LegalRiskSeverity;
  title: string;
  message: string;
  /** Same as `workflowType` when set — stable key for clients expecting `workflowId`. */
  workflowId?: LegalWorkflowType;
  workflowType?: LegalWorkflowType;
  requirementId?: string;
  documentId?: string;
}

/** Next recommended in-product step derived from workflow state (guidance only). */
export interface LegalPendingAction {
  id: string;
  label: string;
  detail: string;
  workflowType?: LegalWorkflowType;
  requirementId?: string;
}

/** Structured disclaimer line for UI/API (not legal advice). */
export interface LegalDisclaimerItem {
  id: string;
  text: string;
  /** Optional grouping for presentation. */
  category?: "general" | "limitation" | "data";
}

export interface LegalDocumentItem {
  id: string;
  label: string;
  status: LegalRequirementStatus;
  workflowType?: LegalWorkflowType;
  requirementId?: string;
  href?: string;
  updatedAt?: string;
}

/** Platform signals used for risk/state (may be sparse). */
export interface LegalHubSignals {
  identityVerificationStatus: "none" | "pending" | "verified" | "rejected" | "unknown";
  termsAccepted: boolean;
  privacyAccepted: boolean;
  hostingTermsAccepted: boolean;
  brokerAgreementAccepted: boolean;
  platformAcknowledgmentAccepted: boolean;
  sellerLegalAccuracyAccepted: boolean;
  hasPublishedOrSubmittedListing: boolean;
  hasDraftListing: boolean;
  fsboVerificationRejected: boolean;
  fsboPendingAdminReview: boolean;
  shortTermListingCount: number;
  brokerLicenseStatus: "none" | "pending" | "verified" | "rejected" | "unknown";
  rentalLandlordListingCount: number;
  rentalTenantApplicationCount: number;
  activeOfferOrDealSignals: boolean;
  /** ISO timestamps when known — for staleness hints only. */
  lastTermsAcceptedAt?: string | null;
  lastPrivacyAcceptedAt?: string | null;
  /** Inference-only fields populated from DB when available */
  sellerDeclarationCompleted?: boolean;
  stripeOnboardingComplete?: boolean;
  longTermRentalTermsAccepted?: boolean;
  leaseRecordPresent?: boolean;
  rentalApplicationLegalAccepted?: boolean;
}

export interface LegalHubFlags {
  legalHubV1: boolean;
  legalHubDocumentsV1: boolean;
  legalHubRisksV1: boolean;
  legalHubAdminReviewV1: boolean;
  legalUploadV1: boolean;
  legalReviewV1: boolean;
  legalWorkflowSubmissionV1: boolean;
  /** Phase 3 — deterministic gates on high-risk actions (soft/hard). */
  legalEnforcementV1: boolean;
  /** Phase 3 — readiness score derived from Legal Hub summary (no ML). */
  legalReadinessV1: boolean;
}

export interface LegalHubContext {
  actorType: LegalHubActorType;
  jurisdiction?: string;
  locale: string;
  country: string;
  userId: string | null;
  requirementStates: LegalRequirementState[];
  documents: LegalDocumentItem[];
  signals: LegalHubSignals;
  flags: LegalHubFlags;
  /** Non-PII warnings when platform signals are missing or partial. */
  missingDataWarnings: string[];
  /** Optional finer-grained availability hints (what is / is not wired end-to-end). */
  availabilityNotes?: string[];
}

export interface LegalHubSummary {
  actorType: LegalHubActorType;
  jurisdiction?: string;
  generatedAt: string;
  disclaimerLines: string[];
  disclaimerItems: LegalDisclaimerItem[];
  pendingActions: LegalPendingAction[];
  missingDataWarnings: string[];
  availabilityNotes?: string[];
  /** Present when legal readiness flag is enabled — deterministic score from checklist + risks (not legal advice). */
  readinessScore?: {
    score: number;
    level: "not_ready" | "partial" | "mostly_ready" | "ready";
    missingCritical: number;
    missingOptional: number;
    completed: number;
    total: number;
  };
  portfolio: {
    totalWorkflows: number;
    completedWorkflows: number;
    pendingWorkflows: number;
    criticalRiskCount: number;
    warningRiskCount: number;
    infoRiskCount: number;
    documentCount: number;
    pendingActionCount: number;
  };
  workflows: LegalWorkflowState[];
  risks: LegalRiskItem[];
  documents: LegalDocumentItem[];
  /** Platform guidance when broker/admin review workflows apply. */
  reviewNotes?: string[];
}
