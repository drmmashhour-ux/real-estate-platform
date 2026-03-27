export enum DeclarationDraftStatus {
  DRAFT = "draft",
  IN_REVIEW = "in_review",
  NEEDS_CHANGES = "needs_changes",
  READY = "ready",
  FINALIZED = "finalized",
}

export enum DeclarationActionType {
  SUGGESTION_REQUESTED = "suggestion_requested",
  SUGGESTION_APPLIED = "suggestion_applied",
  FOLLOWUP_GENERATED = "followup_generated",
  VALIDATION_RUN = "validation_run",
  EXPLAIN_REQUESTED = "explain_requested",
}
