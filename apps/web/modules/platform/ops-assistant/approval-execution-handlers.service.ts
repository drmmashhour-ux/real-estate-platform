/**
 * Low-risk execution handlers — internal artifacts + workflow transitions only.
 */

import { randomBytes } from "node:crypto";

import { isTransitionAllowed } from "../platform-improvement-operator-transitions";
import type { PlatformPriorityStatus } from "../platform-improvement.types";
import {
  getStoredPriorityStatus,
  setPriorityStatus,
} from "../platform-improvement-state.service";
import type { ApprovalExecutionRequest, ApprovalExecutionResult } from "./approval-execution.types";
import {
  addTag,
  archiveTask,
  clearReminder,
  discardConfigDraft,
  discardDraft,
  pushConfigDraft,
  pushDraft,
  pushReminder,
  pushTask,
  removeTag,
  stashExecutionArtifactRefs,
} from "./approval-execution.store";
import { appendApprovalAudit } from "./approval-execution-audit.service";

function nid(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

export async function executeApprovedRequestHandler(
  req: ApprovalExecutionRequest,
  operatorId?: string,
): Promise<ApprovalExecutionResult> {
  switch (req.actionType) {
    case "createInternalReviewTask":
      return handleReviewTask(req, operatorId);
    case "createInternalFollowupTask":
      return handleFollowupTask(req, operatorId);
    case "createInternalDraft":
      return handleDraft(req, operatorId);
    case "addInternalPriorityTag":
      return handleTag(req, operatorId);
    case "updatePriorityWorkflowState":
      return await handleWorkflow(req, operatorId);
    case "prefillInternalConfigDraft":
      return handleConfigDraft(req, operatorId);
    case "createOperatorReminder":
      return handleReminder(req, operatorId);
    default:
      return {
        requestId: req.id,
        success: false,
        reversible: false,
        undoAvailable: false,
        explanation: "Unknown action — not executable.",
      };
  }
}

function handleReviewTask(req: ApprovalExecutionRequest, operatorId?: string): ApprovalExecutionResult {
  const href = req.prefillData.reviewTargetHref?.trim();
  const titleBase = req.prefillData.reviewTitle?.trim() || "Internal review";
  if (!href) {
    return fail(req, "Missing review target URL/path.");
  }
  const taskId = nid("task_rev");
  pushTask({
    id: taskId,
    kind: "review",
    priorityId: req.priorityId,
    title: titleBase,
    href,
    status: "open",
    createdAt: new Date().toISOString(),
    sourceRequestId: req.id,
  });
  stashExecutionArtifactRefs(req.id, { taskId });
  appendApprovalAudit({
    kind: "request_executed",
    actionType: req.actionType,
    priorityId: req.priorityId,
    requestId: req.id,
    operatorId,
    explanation: `Created internal review task ${taskId} → ${href}`,
    meta: { taskId },
  });
  return {
    requestId: req.id,
    success: true,
    reversible: true,
    undoAvailable: true,
    explanation: `Internal review task created (${taskId}). Undo archives it.`,
  };
}

function handleFollowupTask(req: ApprovalExecutionRequest, operatorId?: string): ApprovalExecutionResult {
  const note = req.prefillData.followupNote?.trim() || req.prefillData.draftText?.trim() || "";
  const taskId = nid("task_fu");
  pushTask({
    id: taskId,
    kind: "followup",
    priorityId: req.priorityId,
    title: "Internal follow-up",
    note: note || undefined,
    status: "open",
    createdAt: new Date().toISOString(),
    sourceRequestId: req.id,
  });
  stashExecutionArtifactRefs(req.id, { taskId });
  appendApprovalAudit({
    kind: "request_executed",
    actionType: req.actionType,
    priorityId: req.priorityId,
    requestId: req.id,
    operatorId,
    explanation: `Created internal follow-up task ${taskId}`,
    meta: { taskId },
  });
  return {
    requestId: req.id,
    success: true,
    reversible: true,
    undoAvailable: true,
    explanation: `Follow-up task created (${taskId}). Undo archives it.`,
  };
}

function handleDraft(req: ApprovalExecutionRequest, operatorId?: string): ApprovalExecutionResult {
  const body = req.prefillData.draftText?.trim() ?? "";
  const draftId = nid("draft");
  pushDraft({
    id: draftId,
    priorityId: req.priorityId,
    title: req.description.slice(0, 120),
    body,
    createdAt: new Date().toISOString(),
    sourceRequestId: req.id,
    status: "active",
  });
  stashExecutionArtifactRefs(req.id, { draftId });
  appendApprovalAudit({
    kind: "request_executed",
    actionType: req.actionType,
    priorityId: req.priorityId,
    requestId: req.id,
    operatorId,
    explanation: `Stored internal draft ${draftId}`,
    meta: { draftId },
  });
  return {
    requestId: req.id,
    success: true,
    reversible: true,
    undoAvailable: true,
    explanation: `Internal draft saved (${draftId}). Undo discards it.`,
  };
}

function handleTag(req: ApprovalExecutionRequest, operatorId?: string): ApprovalExecutionResult {
  const tag = req.prefillData.tag?.trim();
  if (!tag) return fail(req, "Missing internal tag.");
  addTag(req.priorityId, tag);
  stashExecutionArtifactRefs(req.id, { tag });
  appendApprovalAudit({
    kind: "request_executed",
    actionType: req.actionType,
    priorityId: req.priorityId,
    requestId: req.id,
    operatorId,
    explanation: `Added internal tag "${tag}"`,
    meta: { tag },
  });
  return {
    requestId: req.id,
    success: true,
    reversible: true,
    undoAvailable: true,
    explanation: `Tag "${tag}" added for this priority. Undo removes it.`,
  };
}

async function handleWorkflow(
  req: ApprovalExecutionRequest,
  operatorId?: string,
): Promise<ApprovalExecutionResult> {
  const target = req.prefillData.targetStatus;
  if (!target) return fail(req, "Missing target workflow status.");

  const previous = getStoredPriorityStatus(req.priorityId);
  if (previous === undefined) {
    return fail(req, "Priority not found in execution store — refresh diagnostics.");
  }
  if (!isTransitionAllowed(previous, target)) {
    return fail(req, `Cannot transition from "${previous}" to "${target}".`);
  }
  const res = await setPriorityStatus(req.priorityId, target);
  if (!res.ok) {
    return fail(req, res.error);
  }
  stashExecutionArtifactRefs(req.id, { previousPriorityStatus: previous });
  appendApprovalAudit({
    kind: "request_executed",
    actionType: req.actionType,
    priorityId: req.priorityId,
    requestId: req.id,
    operatorId,
    explanation: `Workflow ${previous} → ${target}`,
    meta: { previous, target },
  });
  return {
    requestId: req.id,
    success: true,
    reversible: true,
    undoAvailable: true,
    explanation: `Priority status updated to "${target}". Undo attempts one reverse transition when allowed.`,
  };
}

function handleConfigDraft(req: ApprovalExecutionRequest, operatorId?: string): ApprovalExecutionResult {
  const keyHint = req.prefillData.configKeyHint?.trim() ?? "unspecified";
  const value = req.prefillData.configDraftValue?.trim() ?? req.prefillData.draftText?.trim() ?? "";
  const cid = nid("cfg");
  pushConfigDraft({
    id: cid,
    priorityId: req.priorityId,
    keyHint,
    value,
    createdAt: new Date().toISOString(),
    sourceRequestId: req.id,
    status: "active",
  });
  stashExecutionArtifactRefs(req.id, { configDraftId: cid });
  appendApprovalAudit({
    kind: "request_executed",
    actionType: req.actionType,
    priorityId: req.priorityId,
    requestId: req.id,
    operatorId,
    explanation: `Stored internal config draft ${cid} (${keyHint})`,
    meta: { configDraftId: cid },
  });
  return {
    requestId: req.id,
    success: true,
    reversible: true,
    undoAvailable: true,
    explanation: `Non-live config draft recorded (${cid}). Undo discards it.`,
  };
}

function handleReminder(req: ApprovalExecutionRequest, operatorId?: string): ApprovalExecutionResult {
  const message = req.prefillData.reminderMessage?.trim() || req.prefillData.draftText?.trim() || "";
  if (!message) return fail(req, "Reminder message empty.");
  const rid = nid("rem");
  pushReminder({
    id: rid,
    priorityId: req.priorityId,
    message,
    dueAt: req.prefillData.reminderDueAt,
    createdAt: new Date().toISOString(),
    sourceRequestId: req.id,
    status: "active",
  });
  stashExecutionArtifactRefs(req.id, { reminderId: rid });
  appendApprovalAudit({
    kind: "request_executed",
    actionType: req.actionType,
    priorityId: req.priorityId,
    requestId: req.id,
    operatorId,
    explanation: `Operator reminder ${rid}`,
    meta: { reminderId: rid },
  });
  return {
    requestId: req.id,
    success: true,
    reversible: true,
    undoAvailable: true,
    explanation: `Reminder stored (${rid}). Undo clears it.`,
  };
}

function fail(req: ApprovalExecutionRequest, explanation: string): ApprovalExecutionResult {
  return {
    requestId: req.id,
    success: false,
    reversible: false,
    undoAvailable: false,
    explanation,
  };
}

export async function undoExecutionRequestHandler(
  req: ApprovalExecutionRequest,
  operatorId?: string,
): Promise<ApprovalExecutionResult> {
  const refs = req.artifactRefs;
  if (!refs) {
    return {
      requestId: req.id,
      success: false,
      reversible: false,
      undoAvailable: false,
      explanation: "No undo metadata — cannot reverse.",
    };
  }

  if (refs.taskId) {
    const ok = archiveTask(refs.taskId);
    if (ok) {
      appendApprovalAudit({
        kind: "request_undone",
        actionType: req.actionType,
        priorityId: req.priorityId,
        requestId: req.id,
        operatorId,
        explanation: `Archived task ${refs.taskId}`,
      });
      return {
        requestId: req.id,
        success: true,
        reversible: false,
        undoAvailable: false,
        explanation: "Internal task archived.",
      };
    }
  }
  if (refs.draftId) {
    if (discardDraft(refs.draftId)) {
      appendApprovalAudit({
        kind: "request_undone",
        actionType: req.actionType,
        priorityId: req.priorityId,
        requestId: req.id,
        operatorId,
        explanation: `Discarded draft ${refs.draftId}`,
      });
      return {
        requestId: req.id,
        success: true,
        reversible: false,
        undoAvailable: false,
        explanation: "Internal draft discarded.",
      };
    }
  }
  if (refs.configDraftId) {
    if (discardConfigDraft(refs.configDraftId)) {
      appendApprovalAudit({
        kind: "request_undone",
        actionType: req.actionType,
        priorityId: req.priorityId,
        requestId: req.id,
        operatorId,
        explanation: `Discarded config draft ${refs.configDraftId}`,
      });
      return {
        requestId: req.id,
        success: true,
        reversible: false,
        undoAvailable: false,
        explanation: "Config draft discarded.",
      };
    }
  }
  if (refs.reminderId) {
    if (clearReminder(refs.reminderId)) {
      appendApprovalAudit({
        kind: "request_undone",
        actionType: req.actionType,
        priorityId: req.priorityId,
        requestId: req.id,
        operatorId,
        explanation: `Cleared reminder ${refs.reminderId}`,
      });
      return {
        requestId: req.id,
        success: true,
        reversible: false,
        undoAvailable: false,
        explanation: "Reminder cleared.",
      };
    }
  }
  if (refs.tag) {
    if (removeTag(req.priorityId, refs.tag)) {
      appendApprovalAudit({
        kind: "request_undone",
        actionType: req.actionType,
        priorityId: req.priorityId,
        requestId: req.id,
        operatorId,
        explanation: `Removed tag "${refs.tag}"`,
      });
      return {
        requestId: req.id,
        success: true,
        reversible: false,
        undoAvailable: false,
        explanation: "Tag removed.",
      };
    }
  }
  if (refs.previousPriorityStatus !== undefined) {
    const cur = getStoredPriorityStatus(req.priorityId);
    if (cur === undefined) {
      return fail(req, "Cannot undo workflow — priority missing.");
    }
    const prev = refs.previousPriorityStatus as PlatformPriorityStatus;
    if (!isTransitionAllowed(cur, prev)) {
      return {
        requestId: req.id,
        success: false,
        reversible: false,
        undoAvailable: false,
        explanation: `Undo blocked — reverse transition "${cur}" → "${prev}" is not allowed.`,
      };
    }
    const res = await setPriorityStatus(req.priorityId, prev);
    if (!res.ok) {
      return fail(req, res.error);
    }
    appendApprovalAudit({
      kind: "request_undone",
      actionType: req.actionType,
      priorityId: req.priorityId,
      requestId: req.id,
      operatorId,
      explanation: `Workflow reverted ${cur} → ${prev}`,
    });
    return {
      requestId: req.id,
      success: true,
      reversible: false,
      undoAvailable: false,
      explanation: `Status reverted to "${prev}".`,
    };
  }

  return fail(req, "Nothing to undo.");
}
