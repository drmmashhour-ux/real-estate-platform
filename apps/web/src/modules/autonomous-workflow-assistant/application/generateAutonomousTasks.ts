import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { evaluateWorkflowNextSteps } from "@/src/modules/autonomous-workflow-assistant/application/evaluateWorkflowNextSteps";
import { createWorkflowTask } from "@/src/modules/autonomous-workflow-assistant/infrastructure/workflowAutomationRepository";
import { computeTaskFingerprint } from "@/src/modules/autonomous-workflow-assistant/infrastructure/taskDeduplicationService";
import type { SellerDeclarationDraftStatus } from "@prisma/client";

export async function generateAutonomousTasks(args: {
  documentId: string;
  propertyId?: string | null;
  status: SellerDeclarationDraftStatus;
  draftPayload: Record<string, unknown>;
  blockingIssues: string[];
  graphFileHealth?: string;
  missingDependencies?: string[];
  signatureReady?: boolean;
  signatureReasons?: string[];
  criticalGraphIssueCount?: number;
  actorUserId?: string;
}) {
  const steps = evaluateWorkflowNextSteps({
    documentId: args.documentId,
    status: args.status,
    draftPayload: args.draftPayload,
    blockingIssues: args.blockingIssues,
    graphFileHealth: args.graphFileHealth,
    missingDependencies: args.missingDependencies,
    signatureReady: args.signatureReady,
    signatureReasons: args.signatureReasons,
    criticalGraphIssueCount: args.criticalGraphIssueCount,
  });
  const created = [];
  for (const s of steps) {
    const row = await createWorkflowTask({
      documentId: args.documentId,
      propertyId: args.propertyId,
      taskType: s.taskType,
      priority: s.priority,
      targetUserRole: s.targetUserRole,
      summary: s.summary,
      payload: {
        recommendedAction: s.recommendedAction,
        blockedBy: s.blockedBy ?? [],
        confidence: s.confidence,
        sourceRefs: s.sourceRefs ?? [],
        why: s.why,
        triggerLabel: s.triggerLabel,
        resolutionCheck: s.resolutionCheck,
        fingerprint: computeTaskFingerprint(s.taskType, s.blockedBy),
      },
      requiresApproval: s.requiresApproval,
    });
    created.push(row);
  }
  if (args.actorUserId && created.length) {
    captureServerEvent(args.actorUserId, "autonomous_task_created", { documentId: args.documentId, count: created.length });
  }
  return { steps, created };
}
