/**
 * Québec compliance checklist — domain types only (no logic).
 */

export type QuebecComplianceDomain =
  | "listing"
  | "seller"
  | "landlord"
  | "broker"
  | "short_term_rental";

export type QuebecComplianceSeverity = "info" | "warning" | "critical";

export type QuebecComplianceItem = {
  id: string;
  domain: QuebecComplianceDomain;
  label: string;
  description: string;
  required: boolean;
  severity: QuebecComplianceSeverity;
  /** Keys checked in listing JSON / parsed legal record payloads / aggregates — informational for auditors. */
  evidenceKeys: string[];
  /** When true and the item does not pass, publish must be blocked. */
  blocking: boolean;
};

export type QuebecComplianceCheckResult = {
  itemId: string;
  passed: boolean;
  severity: QuebecComplianceSeverity;
  message: string;
  evidenceFound: boolean;
};

export type QuebecComplianceChecklistResult = {
  domain: QuebecComplianceDomain;
  items: QuebecComplianceItem[];
  results: QuebecComplianceCheckResult[];
  readinessScore: number;
  blockingIssues: string[];
  warnings: string[];
};

export type ListingComplianceDecision = {
  listingId: string;
  allowed: boolean;
  reasons: string[];
  blockingIssues: string[];
  readinessScore: number;
};

/** Trimmed checklist row for preview/API surfaces — no raw document payloads. */
export type QuebecComplianceChecklistSummaryItem = {
  itemId: string;
  passed: boolean;
  label: string;
  severity: QuebecComplianceSeverity;
  blocking: boolean;
};

/** Read-only marketplace preview attachment (deterministic gate snapshot). */
export type ListingQuebecCompliancePreview = {
  featureEnabled: true;
  appliesToJurisdiction: boolean;
  readinessScore: number;
  allowed: boolean;
  blockingIssueIds: string[];
  userSafeReasons: string[];
  checklistSummary: QuebecComplianceChecklistSummaryItem[];
};
