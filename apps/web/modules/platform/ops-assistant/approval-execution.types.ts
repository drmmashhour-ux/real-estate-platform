/**
 * Approval-based execution — internal low-risk actions only; operator approves every execution.
 */

import type { PlatformPriorityStatus } from "../platform-improvement.types";

/** Strict allowlist — anything else cannot be executed via this layer. Future review registry does not modify this list. */
export const APPROVAL_EXECUTABLE_ACTION_KINDS = [
  "createInternalReviewTask",
  "createInternalFollowupTask",
  "createInternalDraft",
  "addInternalPriorityTag",
  "updatePriorityWorkflowState",
  "prefillInternalConfigDraft",
  "createOperatorReminder",
] as const;

export type ApprovalExecutableActionKind = (typeof APPROVAL_EXECUTABLE_ACTION_KINDS)[number];

export function isApprovalExecutableActionKind(x: string): x is ApprovalExecutableActionKind {
  return (APPROVAL_EXECUTABLE_ACTION_KINDS as readonly string[]).includes(x);
}

export type ApprovalPrefillPayload = {
  draftText?: string;
  reviewTargetHref?: string;
  reviewTitle?: string;
  followupNote?: string;
  /** Single tag token (internal triage only). */
  tag?: string;
  targetStatus?: PlatformPriorityStatus;
  configKeyHint?: string;
  configDraftValue?: string;
  reminderMessage?: string;
  reminderDueAt?: string;
};

export type ApprovalExecutionStatus =
  | "pending"
  | "approved"
  | "denied"
  | "executed"
  | "failed"
  | "cancelled";

export type ExecutionArtifactRefs = {
  taskId?: string;
  draftId?: string;
  configDraftId?: string;
  reminderId?: string;
  tag?: string;
  previousPriorityStatus?: PlatformPriorityStatus;
};

export type ApprovalExecutionRequest = {
  id: string;
  suggestionId: string;
  priorityId: string;
  actionType: ApprovalExecutableActionKind;
  /** Snapshot for audit — what the operator saw */
  description: string;
  prefillData: ApprovalPrefillPayload;
  riskLevel: "low";
  requiresApproval: true;
  status: ApprovalExecutionStatus;
  createdAt: string;
  approvedAt?: string;
  deniedAt?: string;
  executedAt?: string;
  undoneAt?: string;
  approvedBy?: string;
  deniedBy?: string;
  executedBy?: string;
  undoneBy?: string;
  notes?: string;
  /** Failure or block reason */
  lastError?: string;
  /** Set after execution — used for reversible undo */
  artifactRefs?: ExecutionArtifactRefs;
};

export type ApprovalExecutionResult = {
  requestId: string;
  success: boolean;
  reversible: boolean;
  undoAvailable: boolean;
  explanation: string;
};

export type ApprovalAuditEventKind =
  | "request_created"
  | "request_approved"
  | "request_denied"
  | "request_executed"
  | "request_failed"
  | "request_undone"
  | "execution_blocked_safety";

export type ApprovalAuditEntry = {
  id: string;
  kind: ApprovalAuditEventKind;
  at: string;
  actionType: ApprovalExecutableActionKind;
  priorityId: string;
  requestId: string;
  operatorId?: string;
  explanation: string;
  meta?: Record<string, unknown>;
};
