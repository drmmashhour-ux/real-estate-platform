/** Legal Hub Phase 2 — string statuses only (migration-safe). Not legal advice. */

export const LEGAL_HUB_DOCUMENT_STATUS = {
  UPLOADED: "uploaded",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type LegalHubDocumentStatus =
  (typeof LEGAL_HUB_DOCUMENT_STATUS)[keyof typeof LEGAL_HUB_DOCUMENT_STATUS];

export const LEGAL_HUB_WORKFLOW_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type LegalHubWorkflowStatus =
  (typeof LEGAL_HUB_WORKFLOW_STATUS)[keyof typeof LEGAL_HUB_WORKFLOW_STATUS];

export const LEGAL_HUB_AUDIT_ENTITY = {
  DOCUMENT: "document",
  WORKFLOW: "workflow",
} as const;

export const LEGAL_HUB_AUDIT_ACTION = {
  UPLOAD: "upload",
  SUBMIT: "submit",
  APPROVE: "approve",
  REJECT: "reject",
  DELETE: "delete",
  DRAFT_SAVE: "draft_save",
  WORKFLOW_SUBMIT: "workflow_submit",
} as const;

/** Max upload size for PDF / JPEG / PNG (aligned with seller supporting docs). */
export const LEGAL_HUB_DOC_MAX_BYTES = 10 * 1024 * 1024;

export const LEGAL_HUB_ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export const LEGAL_HUB_REVIEW_DECISION = {
  APPROVE: "approve",
  REJECT: "reject",
} as const;

export type LegalHubReviewDecision =
  (typeof LEGAL_HUB_REVIEW_DECISION)[keyof typeof LEGAL_HUB_REVIEW_DECISION];

export const LEGAL_HUB_ACTOR_TYPES: ReadonlySet<string> = new Set([
  "buyer",
  "seller",
  "landlord",
  "tenant",
  "broker",
  "host",
  "admin",
]);
