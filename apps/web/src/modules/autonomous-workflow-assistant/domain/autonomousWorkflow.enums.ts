export const AutonomousTaskType = {
  FOLLOW_UP_QUESTIONS: "follow_up_questions",
  REVIEWER_COMMENT_DRAFT: "reviewer_comment_draft",
  CHECKLIST_MISSING_ITEMS: "checklist_missing_items",
  NOTIFY_BLOCKER: "notify_blocker",
  ROUTE_TO_REVIEW: "route_to_review",
  ROUTE_NEEDS_CHANGES: "route_needs_changes",
  SIGNATURE_READINESS: "signature_readiness",
  CASE_SUMMARY_DRAFT: "case_summary_draft",
  ESCALATION_RECOMMENDATION: "escalation_recommendation",
} as const;

export const WorkflowTriggerType = {
  VALIDATION_COMPLETED: "validation_completed",
  CONTRADICTION_DETECTED: "contradiction_detected",
  REVIEW_REQUESTED: "review_requested",
  STATUS_CHANGED: "status_changed",
  SIGNATURE_CHANGED: "signature_changed",
  LEGAL_GRAPH_REBUILT: "legal_graph_rebuilt",
  DOCUMENT_UPDATED: "document_updated",
} as const;
