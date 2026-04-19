/**
 * Approval workflow — explicit request → approve → execute; never silent execution.
 */

import { randomBytes } from "node:crypto";

import type { PlatformImprovementPriority, PlatformPriorityStatus } from "../platform-improvement.types";
import {
  opsAssistantApprovalFlags,
} from "@/config/feature-flags";
import { buildOpsSuggestions } from "./ops-assistant.service";
import type { OpsAssistantSuggestion } from "./ops-assistant.types";
import type {
  ApprovalExecutionRequest,
  ApprovalExecutionResult,
  ApprovalExecutableActionKind,
  ApprovalPrefillPayload,
} from "./approval-execution.types";
import { isApprovalExecutableActionKind } from "./approval-execution.types";
import { appendApprovalAudit } from "./approval-execution-audit.service";
import {
  executeApprovedRequestHandler,
  undoExecutionRequestHandler,
} from "./approval-execution-handlers.service";
import {
  recordApprovalApproved,
  recordApprovalBlockedSafety,
  recordApprovalDenied,
  recordApprovalExecuted,
  recordApprovalFailed,
  recordApprovalRequestCreated,
  recordApprovalUndone,
} from "./approval-execution-monitoring.service";
import {
  findPendingDuplicate,
  getRequest,
  listAuditSorted,
  listRequestsSorted,
  recordRequest,
  resetApprovalExecutionStoreForTests,
  updateRequest,
} from "./approval-execution.store";
import { resetApprovalMonitoringForTests } from "./approval-execution-monitoring.service";

function rid(): string {
  return `areq_${randomBytes(12).toString("hex")}`;
}

export type ApprovalSafetyContext = {
  killSwitchActive: boolean;
  executionFlagOn: boolean;
};

function gateReason(ctx: ApprovalSafetyContext): string | null {
  if (!ctx.executionFlagOn) return "FEATURE_OPS_ASSISTANT_APPROVAL_EXECUTION_V1 is off";
  if (ctx.killSwitchActive) return "FEATURE_OPS_ASSISTANT_APPROVAL_KILL_SWITCH is active";
  return null;
}

export function assertApprovalExecutionSafe(ctx: ApprovalSafetyContext): string | null {
  return gateReason(ctx);
}

export function findSuggestionForPriority(
  priorityId: string,
  suggestionId: string,
  priorities: PlatformImprovementPriority[],
  statusByPriorityId: Record<string, PlatformPriorityStatus>,
): OpsAssistantSuggestion | undefined {
  const p = priorities.find((x) => x.id === priorityId);
  if (!p) return undefined;
  const st = statusByPriorityId[priorityId] ?? "new";
  const list = buildOpsSuggestions(p, { currentStatus: st });
  return list.find((s) => s.id === suggestionId);
}

export function createApprovalExecutionRequest(args: {
  priorityId: string;
  suggestionId: string;
  priorities: PlatformImprovementPriority[];
  statusByPriorityId: Record<string, PlatformPriorityStatus>;
  operatorId?: string;
  notes?: string;
  safety: ApprovalSafetyContext;
}): { ok: true; request: ApprovalExecutionRequest } | { ok: false; error: string } {
  const blocked = gateReason(args.safety);
  if (blocked) {
    recordApprovalBlockedSafety(blocked);
    appendApprovalAudit({
      kind: "execution_blocked_safety",
      actionType: "createInternalDraft",
      priorityId: args.priorityId,
      requestId: "blocked",
      operatorId: args.operatorId,
      explanation: blocked,
    });
    return { ok: false, error: blocked };
  }

  const sug = findSuggestionForPriority(args.priorityId, args.suggestionId, args.priorities, args.statusByPriorityId);
  if (!sug?.executable) {
    return { ok: false, error: "Suggestion not found or has no executable approval path." };
  }

  const dup = findPendingDuplicate(args.suggestionId);
  if (dup) {
    return { ok: false, error: "A pending approval already exists for this suggestion." };
  }

  const actionType = sug.executable.actionType;
  if (!isApprovalExecutableActionKind(actionType)) {
    return { ok: false, error: "Invalid executable action." };
  }

  const payload = normalizePayload(actionType, sug.executable.proposedPayload);

  const req: ApprovalExecutionRequest = {
    id: rid(),
    suggestionId: sug.id,
    priorityId: sug.priorityId,
    actionType,
    description: `${sug.title} — ${sug.executable.expectedOutcome}`,
    prefillData: payload,
    riskLevel: "low",
    requiresApproval: true,
    status: "pending",
    createdAt: new Date().toISOString(),
    notes: args.notes,
  };

  recordRequest(req);
  recordApprovalRequestCreated(req.id);
  appendApprovalAudit({
    kind: "request_created",
    actionType,
    priorityId: req.priorityId,
    requestId: req.id,
    operatorId: args.operatorId,
    explanation: `Approval request created for suggestion ${sug.id}`,
    meta: { suggestionTitle: sug.title },
  });

  return { ok: true, request: req };
}

function normalizePayload(kind: ApprovalExecutableActionKind, raw: ApprovalPrefillPayload): ApprovalPrefillPayload {
  /* Strip unknown keys by picking allowed fields only */
  const base: ApprovalPrefillPayload = {};
  if (raw.draftText !== undefined) base.draftText = raw.draftText;
  if (raw.reviewTargetHref !== undefined) base.reviewTargetHref = raw.reviewTargetHref;
  if (raw.reviewTitle !== undefined) base.reviewTitle = raw.reviewTitle;
  if (raw.followupNote !== undefined) base.followupNote = raw.followupNote;
  if (raw.tag !== undefined) base.tag = raw.tag;
  if (raw.targetStatus !== undefined) base.targetStatus = raw.targetStatus;
  if (raw.configKeyHint !== undefined) base.configKeyHint = raw.configKeyHint;
  if (raw.configDraftValue !== undefined) base.configDraftValue = raw.configDraftValue;
  if (raw.reminderMessage !== undefined) base.reminderMessage = raw.reminderMessage;
  if (raw.reminderDueAt !== undefined) base.reminderDueAt = raw.reminderDueAt;

  /* Minimal validation per kind */
  switch (kind) {
    case "updatePriorityWorkflowState":
      if (!base.targetStatus) return {};
      return { targetStatus: base.targetStatus };
    case "createInternalReviewTask":
      return {
        reviewTargetHref: base.reviewTargetHref,
        reviewTitle: base.reviewTitle,
      };
    case "prefillInternalConfigDraft":
      return {
        configKeyHint: base.configKeyHint,
        configDraftValue: base.configDraftValue ?? base.draftText,
      };
    default:
      return base;
  }
}

export function approveExecutionRequest(args: {
  requestId: string;
  operatorId?: string;
  safety: ApprovalSafetyContext;
}): { ok: true; request: ApprovalExecutionRequest } | { ok: false; error: string } {
  const blocked = gateReason(args.safety);
  if (blocked) {
    recordApprovalBlockedSafety(blocked);
    return { ok: false, error: blocked };
  }

  const req = getRequest(args.requestId);
  if (!req) return { ok: false, error: "Request not found." };
  if (req.status !== "pending") return { ok: false, error: `Request is not pending (status=${req.status}).` };

  const at = new Date().toISOString();
  const next: ApprovalExecutionRequest = {
    ...req,
    status: "approved",
    approvedAt: at,
    approvedBy: args.operatorId,
  };
  updateRequest(req.id, next);
  recordApprovalApproved(req.id);
  appendApprovalAudit({
    kind: "request_approved",
    actionType: req.actionType,
    priorityId: req.priorityId,
    requestId: req.id,
    operatorId: args.operatorId,
    explanation: "Operator approved execution (not yet run).",
  });

  return { ok: true, request: getRequest(args.requestId)! };
}

export function denyExecutionRequest(args: {
  requestId: string;
  operatorId?: string;
  safety: ApprovalSafetyContext;
}): { ok: true; request: ApprovalExecutionRequest } | { ok: false; error: string } {
  const blocked = gateReason(args.safety);
  if (blocked) {
    recordApprovalBlockedSafety(blocked);
    return { ok: false, error: blocked };
  }

  const req = getRequest(args.requestId);
  if (!req) return { ok: false, error: "Request not found." };
  if (req.status !== "pending") return { ok: false, error: `Request is not pending (status=${req.status}).` };

  const at = new Date().toISOString();
  updateRequest(req.id, {
    status: "denied",
    deniedAt: at,
    deniedBy: args.operatorId,
  });
  recordApprovalDenied(req.id);
  appendApprovalAudit({
    kind: "request_denied",
    actionType: req.actionType,
    priorityId: req.priorityId,
    requestId: req.id,
    operatorId: args.operatorId,
    explanation: "Operator denied approval request.",
  });

  return { ok: true, request: getRequest(args.requestId)! };
}

export async function executeApprovedRequest(args: {
  requestId: string;
  operatorId?: string;
  safety: ApprovalSafetyContext;
}): Promise<{ ok: true; request: ApprovalExecutionRequest; result: ApprovalExecutionResult } | { ok: false; error: string }> {
  const blocked = gateReason(args.safety);
  if (blocked) {
    recordApprovalBlockedSafety(blocked);
    return { ok: false, error: blocked };
  }

  const req = getRequest(args.requestId);
  if (!req) return { ok: false, error: "Request not found." };
  if (req.status !== "approved") {
    return { ok: false, error: `Execution requires approved status (current=${req.status}).` };
  }

  const fresh = getRequest(args.requestId)!;
  const result = await executeApprovedRequestHandler(fresh, args.operatorId);

  const at = new Date().toISOString();
  if (result.success) {
    updateRequest(req.id, {
      status: "executed",
      executedAt: at,
      executedBy: args.operatorId,
      lastError: undefined,
    });
    recordApprovalExecuted(req.id);
  } else {
    updateRequest(req.id, {
      status: "failed",
      executedAt: at,
      executedBy: args.operatorId,
      lastError: result.explanation,
    });
    recordApprovalFailed(req.id, result.explanation);
    appendApprovalAudit({
      kind: "request_failed",
      actionType: req.actionType,
      priorityId: req.priorityId,
      requestId: req.id,
      operatorId: args.operatorId,
      explanation: result.explanation,
    });
  }

  return {
    ok: true,
    request: getRequest(args.requestId)!,
    result,
  };
}

export async function undoExecutionRequest(args: {
  requestId: string;
  operatorId?: string;
  safety: ApprovalSafetyContext;
}): Promise<{ ok: true; result: ApprovalExecutionResult } | { ok: false; error: string }> {
  const blocked = gateReason(args.safety);
  if (blocked) {
    recordApprovalBlockedSafety(blocked);
    return { ok: false, error: blocked };
  }

  const req = getRequest(args.requestId);
  if (!req) return { ok: false, error: "Request not found." };
  if (req.status !== "executed") {
    return { ok: false, error: "Undo only applies to successfully executed requests." };
  }

  const fresh = getRequest(args.requestId)!;
  const result = await undoExecutionRequestHandler(fresh, args.operatorId);
  if (result.success) {
    const at = new Date().toISOString();
    updateRequest(req.id, {
      status: "cancelled",
      undoneAt: at,
      undoneBy: args.operatorId,
    });
    recordApprovalUndone(req.id);
    return { ok: true, result };
  }
  recordApprovalFailed(req.id, result.explanation);
  return { ok: false, error: result.explanation };
}

export function listExecutionRequests(): ApprovalExecutionRequest[] {
  return listRequestsSorted();
}

export function listRecentApprovalAudit(limit = 80) {
  return listAuditSorted(limit);
}

/** Server-only: reads process env for feature flags */
export function getDefaultApprovalSafetyContext(): ApprovalSafetyContext {
  return {
    killSwitchActive: opsAssistantApprovalFlags.opsAssistantApprovalKillSwitch,
    executionFlagOn: opsAssistantApprovalFlags.opsAssistantApprovalExecutionV1,
  };
}

export function resetApprovalExecutionForTests(): void {
  resetApprovalExecutionStoreForTests();
  resetApprovalMonitoringForTests();
}
