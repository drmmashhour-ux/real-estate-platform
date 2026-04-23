/**
 * OACIQ-oriented clause registry + validation (deterministic).
 * Does not approve instruments; broker remains accountable.
 */

export type ClauseCategory =
  | "brokerage_contract"
  | "amendment"
  | "promise_to_purchase"
  | "other_clauses"
  | "enterprise_sale";

/** Mandatory structural components (OACIQ clarity posture). */
export type ClauseComponentKey = "action" | "actor" | "deadline" | "notice" | "consequence";

export type ClauseComplianceFlag =
  | "dual_representation_warning"
  | "off_market"
  | "security_deposit_trust"
  | "enterprise_combined_transaction";

export type ClauseLibraryEntry = {
  id: string;
  category: ClauseCategory;
  labelFr: string;
  labelEn: string;
  /** Counsel-facing template; placeholders {{param}} optional. */
  templateFr: string;
  templateEn?: string;
  requiredParams: ClauseComponentKey[];
  /** Additional fields beyond the five core components. */
  optionalParams?: string[];
  complianceFlags: ClauseComplianceFlag[];
  /** Reference label (e.g. mandatory forms era). */
  version: string;
  active: boolean;
};

export type ClauseInstance = {
  clauseId: string;
  /** Populated legal parameters — all requiredParams must be non-empty strings (trimmed). */
  params: Partial<Record<string, string>>;
  /** Optional rendered clause text for ambiguity scan (FR primary). */
  narrativeFr?: string;
  narrativeEn?: string;
};

export type ClauseIssueSeverity = "blocking" | "warning";

export type ClauseValidationIssue = {
  code: string;
  severity: ClauseIssueSeverity;
  message: string;
  clauseId: string;
};

export type ClauseValidationResult = {
  valid: boolean;
  /** If any blocking issue — submission should be rejected by policy. */
  blockSubmission: boolean;
  issues: ClauseValidationIssue[];
  enforcement: ClauseEnforcementDescriptor[];
  /** Non-authoritative hints (AI or deterministic). */
  suggestions: string[];
  aiAssistedSuggestions: boolean;
};

export type ClauseEnforcementKind =
  | "off_market_listing"
  | "stop_marketing"
  | "maintain_contract_validity"
  | "trust_account_workflow"
  | "dual_representation_disclosure"
  | "enterprise_scope_review";

export type ClauseEnforcementDescriptor = {
  kind: ClauseEnforcementKind;
  clauseId: string;
  /** Human-readable ops checklist — callers map to real workflows. */
  actions: string[];
};

export type ClauseAuditEvent =
  | "clause_created"
  | "clause_modified"
  | "clause_validated"
  | "clause_approved";
