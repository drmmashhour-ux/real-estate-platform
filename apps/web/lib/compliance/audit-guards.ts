/**
 * Compliance enforcement helpers (raise explicit errors for policy violations).
 */

export function forbidComplianceAuditRecordDeletion(): never {
  throw new Error("COMPLIANCE_AUDIT_DELETION_FORBIDDEN");
}

/** Product code must not `delete()` compliance-bound rows — use soft-delete (`deletedAt`) instead. */
export function forbidComplianceHardDelete(): never {
  throw new Error("COMPLIANCE_HARD_DELETE_FORBIDDEN");
}

export function assertExportBundleNotSealed(bundle: { status: string }) {
  if (bundle.status === "sealed") {
    throw new Error("SEALED_EXPORT_IMMUTABLE");
  }
}

/** Regulator / inspection wording — same immutability rule as sealed export bundles. */
export function assertReportNotSealed(bundle: { status: string }) {
  if (bundle.status === "sealed") {
    throw new Error("REPORT_IMMUTABLE");
  }
}

export function assertHumanReviewCompletedIfRequired(input: {
  humanReviewRequired: boolean;
  humanReviewCompleted: boolean;
  /** When true, the guarded action requires completed human review first. */
  actionNeedsApproval: boolean;
}) {
  if (input.actionNeedsApproval && input.humanReviewRequired && !input.humanReviewCompleted) {
    throw new Error("HUMAN_REVIEW_REQUIRED_BEFORE_COMPLETION");
  }
}
