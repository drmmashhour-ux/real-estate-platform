/**
 * Certificate of location — broker workflow support types only (not legal advice).
 */

export type CertificateOfLocationStatus =
  | "missing"
  | "uploaded"
  | "parsed"
  | "needs_review"
  | "appears_current"
  | "may_be_outdated"
  | "rejected";

export type CertificateOfLocationReadinessLevel =
  | "not_ready"
  | "partial"
  | "review_required"
  | "ready_for_broker_review";

export type CertificateOfLocationRiskLevel = "low" | "guarded" | "elevated" | "high";

export type CertificateOfLocationChecklistItem = {
  id: string;
  label: string;
  description: string;
  required: boolean;
  blocking: boolean;
  severity: "info" | "warning" | "critical";
};

export type CertificateOfLocationChecklistResult = {
  itemId: string;
  passed: boolean;
  message: string;
  severity: "info" | "warning" | "critical";
};

/** Structured fields extracted from Legal Hub JSON only — no OCR. */
export type CertificateOfLocationParsedData = {
  issueDate?: string | null;
  certificateNumber?: string | null;
  lotNumber?: string | null;
  address?: string | null;
  municipality?: string | null;
  surveyorName?: string | null;
};

export type CertificateOfLocationTimelineSignals = {
  hasIssueDate: boolean;
  estimatedAgeDays?: number | null;
  flaggedAsPotentiallyOutdated: boolean;
};

export type CertificateOfLocationConsistencySignals = {
  addressMatchesListing: boolean | null;
  lotMatchesListing: boolean | null;
  mismatches: string[];
};

export type CertificateOfLocationExplainability = {
  reasons: string[];
  contributingSignals: string[];
};

export type CertificateOfLocationSummary = {
  listingId: string;
  status: CertificateOfLocationStatus;
  readinessLevel: CertificateOfLocationReadinessLevel;
  riskLevel: CertificateOfLocationRiskLevel;
  checklistResults: CertificateOfLocationChecklistResult[];
  blockingIssues: string[];
  warnings: string[];
  nextSteps: string[];
  availabilityNotes: string[];
  parsedData?: CertificateOfLocationParsedData;
  timelineSignals?: CertificateOfLocationTimelineSignals;
  consistencySignals?: CertificateOfLocationConsistencySignals;
  explainability?: CertificateOfLocationExplainability;
};

export type CertificateOfLocationContext = {
  listingId: string;
  propertyType?: string | null;
  listingStatus?: string | null;
  listingCountry?: string | null;
  listingRegion?: string | null;
  fsboListingUpdatedAt?: string | null;
  legalRecords?: Array<Record<string, unknown>>;
  uploadedDocuments?: Array<Record<string, unknown>>;
  parsedRecordData?: Record<string, unknown> | null;
  validationSummary?: Record<string, unknown> | null;
  brokerFlow?: boolean;
  offerStage?: boolean;
  changedSinceCertificate?: boolean | null;
  /** Listing address line for consistency checks only (no document bodies). */
  listingAddress?: string | null;
  listingCity?: string | null;
  listingCadastre?: string | null;
  /** Sparse notes when upstream data was missing or partially loaded. */
  availabilityNotes?: string[];
};
