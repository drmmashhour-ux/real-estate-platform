import { prisma } from "@/lib/db";

export const complianceAuditKeys = {
  caseOpened: "compliance.case.opened",
  caseResolved: "compliance.case.resolved",
  caseUpdated: "compliance.case.updated",
  reviewCreated: "compliance.qa_review.created",
  reviewCompleted: "compliance.qa_review.completed",
  escalationCreated: "compliance.escalation.created",
  escalationResolved: "compliance.escalation.resolved",
  blockedClosingFlagged: "compliance.blocked_closing.flagged",
  changesRequested: "compliance.review.changes_requested",
  checklistUpdated: "compliance.qa_review.checklist_updated",
  commandCenterViewed: "compliance.command_center.viewed",
  ruleEngineRun: "compliance.rule_engine.run",
} as const;

export async function logComplianceAudit(input: {
  actorUserId: string;
  actionKey: string;
  caseId?: string | null;
  reviewId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await prisma.complianceAuditLog.create({
    data: {
      actorUserId: input.actorUserId,
      actionKey: input.actionKey,
      caseId: input.caseId ?? undefined,
      reviewId: input.reviewId ?? undefined,
      payload: (input.payload ?? {}) as object,
    },
  });
}
