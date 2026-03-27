import { evaluateActionPolicy } from "@/src/modules/autonomous-workflow-assistant/infrastructure/workflowActionPolicyService";
import {
  bulkCompleteTasks,
  createWorkflowTask,
  findLatestCreatedAtForFingerprint,
  listWorkflowTasks,
  recordWorkflowAutomationEvent,
} from "@/src/modules/autonomous-workflow-assistant/infrastructure/workflowAutomationRepository";
import { createAuditLog } from "@/src/modules/legal-workflow/infrastructure/legalWorkflowRepository";
import { notifyWorkflowEvent } from "@/src/modules/autonomous-workflow-assistant/infrastructure/workflowNotificationService";
import { AutonomousTaskType, WorkflowTriggerType } from "@/src/modules/autonomous-workflow-assistant/domain/autonomousWorkflow.enums";
import { resolveTaskApprovalFlags } from "@/src/modules/autonomous-workflow-assistant/policies/approvalRequiredPolicy";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import type { AutonomousTaskOutput } from "@/src/modules/autonomous-workflow-assistant/domain/autonomousWorkflow.types";
import type { ResolutionSnapshot } from "@/src/modules/autonomous-workflow-assistant/infrastructure/taskResolutionService";
import { findPendingTaskIdsToAutoComplete } from "@/src/modules/autonomous-workflow-assistant/infrastructure/taskResolutionService";
import { computeTaskFingerprint, shouldSkipDuplicateTaskCreation } from "@/src/modules/autonomous-workflow-assistant/infrastructure/taskDeduplicationService";

export type SafeAutomationInput = {
  documentId: string;
  actorUserId: string;
  triggerType: (typeof WorkflowTriggerType)[keyof typeof WorkflowTriggerType];
  steps?: AutonomousTaskOutput[];
  actions?: Array<{ actionType: string; payload?: Record<string, unknown> }>;
  /** When provided, pending tasks whose blockers are cleared are auto-completed (safe, no binding actions). */
  resolutionSnapshot?: ResolutionSnapshot;
};

/**
 * Executes only policy-allowed automations. Never approves, finalizes, or sends signatures.
 */
export async function runSafeWorkflowAutomations(input: SafeAutomationInput) {
  const results: Array<{ actionType: string; status: string }> = [];

  if (Array.isArray(input.steps) && input.steps.length) {
    if (input.resolutionSnapshot) {
      const pendingRows = await listWorkflowTasks({ documentId: input.documentId, status: "pending" }).catch(() => []);
      const toComplete = findPendingTaskIdsToAutoComplete(
        pendingRows.map((t) => ({ id: t.id, status: t.status, payload: t.payload })),
        input.resolutionSnapshot,
      );
      if (toComplete.length) {
        await bulkCompleteTasks(toComplete);
        await recordWorkflowAutomationEvent({
          triggerType: input.triggerType,
          entityType: "seller_declaration_draft",
          entityId: input.documentId,
          actionType: "tasks_auto_completed:blockers_cleared",
          status: "completed",
          payload: { taskIds: toComplete, count: toComplete.length },
        });
        captureServerEvent(input.actorUserId, "workflow_safe_action_executed", {
          documentId: input.documentId,
          kind: "task_auto_completed",
          count: toComplete.length,
        });
      }
    }

    const existingPending = await listWorkflowTasks({ documentId: input.documentId, status: "pending" }).catch(() => []);
    const pendingFingerprints = new Set<string>();
    for (const t of existingPending) {
      const fp = (t.payload as { fingerprint?: string })?.fingerprint;
      if (typeof fp === "string") pendingFingerprints.add(fp);
    }
    const nowMs = Date.now();

    for (const raw of input.steps) {
      const step = resolveTaskApprovalFlags(raw);
      const fingerprint = computeTaskFingerprint(step.taskType, step.blockedBy);

      if (
        shouldSkipDuplicateTaskCreation({
          fingerprint,
          pendingFingerprints,
          lastCreatedAtForFingerprint: await findLatestCreatedAtForFingerprint(input.documentId, fingerprint),
          nowMs,
        })
      ) {
        results.push({ actionType: step.taskType, status: "skipped_duplicate_or_cooldown" });
        continue;
      }

      await createWorkflowTask({
        documentId: input.documentId,
        propertyId: null,
        taskType: step.taskType,
        priority: step.priority,
        targetUserRole: step.targetUserRole,
        summary: step.summary,
        requiresApproval: step.requiresApproval,
        payload: {
          recommendedAction: step.recommendedAction,
          blockedBy: step.blockedBy ?? [],
          confidence: step.confidence,
          sourceRefs: step.sourceRefs ?? [],
          why: step.why,
          triggerLabel: step.triggerLabel,
          resolutionCheck: step.resolutionCheck,
          fingerprint,
        },
      });

      pendingFingerprints.add(fingerprint);

      const automationStatus = step.requiresApproval ? "pending" : "completed";
      await recordWorkflowAutomationEvent({
        triggerType: input.triggerType,
        entityType: "seller_declaration_draft",
        entityId: input.documentId,
        actionType: `task_created:${step.taskType}`,
        status: automationStatus,
        payload: { requiresApproval: step.requiresApproval, fingerprint },
      });

      captureServerEvent(input.actorUserId, "autonomous_task_created", {
        documentId: input.documentId,
        taskType: step.taskType,
        requiresApproval: step.requiresApproval,
      });

      if (!step.requiresApproval) {
        captureServerEvent(input.actorUserId, "workflow_safe_action_executed", {
          documentId: input.documentId,
          taskType: step.taskType,
        });
      }

      if (step.taskType === AutonomousTaskType.SIGNATURE_READINESS) {
        captureServerEvent(input.actorUserId, "signature_readiness_generated", { documentId: input.documentId });
      }
      if (step.taskType === AutonomousTaskType.ESCALATION_RECOMMENDATION) {
        captureServerEvent(input.actorUserId, "workflow_escalation_recommended", { documentId: input.documentId });
      }

      results.push({ actionType: step.taskType, status: step.requiresApproval ? "requires_approval" : "success" });
    }

    return { results };
  }

  const actions = input.actions ?? [];
  for (const action of actions) {
    const policy = evaluateActionPolicy(action.actionType);
    if (!policy.mayAutoExecute) {
      await recordWorkflowAutomationEvent({
        triggerType: input.triggerType,
        entityType: "seller_declaration_draft",
        entityId: input.documentId,
        actionType: action.actionType,
        status: "blocked",
        payload: { reason: "requires_approval_or_restricted" },
      });
      captureServerEvent(input.actorUserId, "workflow_restricted_action_blocked", {
        documentId: input.documentId,
        actionType: action.actionType,
      });
      results.push({ actionType: action.actionType, status: "blocked" });
      continue;
    }

    if (action.actionType === "draft_internal_comment" && action.payload?.text) {
      await createAuditLog({
        documentId: input.documentId,
        actorUserId: input.actorUserId,
        actionType: "internal_comment_draft",
        metadata: { text: String(action.payload.text), autonomous: true },
      });
      captureServerEvent(input.actorUserId, "autonomous_task_created", { documentId: input.documentId, kind: "internal_comment_draft" });
      captureServerEvent(input.actorUserId, "workflow_safe_action_executed", { documentId: input.documentId, kind: "internal_comment_draft" });
    }

    if (action.actionType === "emit_analytics_event" && action.payload?.event) {
      notifyWorkflowEvent(input.actorUserId, String(action.payload.event), { documentId: input.documentId, ...action.payload });
    }

    await recordWorkflowAutomationEvent({
      triggerType: input.triggerType,
      entityType: "seller_declaration_draft",
      entityId: input.documentId,
      actionType: action.actionType,
      status: "success",
      payload: action.payload,
    });
    results.push({ actionType: action.actionType, status: "success" });
  }

  return { results };
}
