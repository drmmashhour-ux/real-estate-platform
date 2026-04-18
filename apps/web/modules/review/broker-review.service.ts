import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { dealExecutionFlags } from "@/config/feature-flags";
import { logDealExecutionEvent } from "@/lib/deals/execution-events";
import { setDocumentWorkflowStatus } from "@/modules/deals/deal-state.service";
import { logApprovalAction } from "./approval-log.service";
import { recordDocumentVersion } from "./versioning.service";

/**
 * Broker marks a document workflow step — never implies official OACIQ form is filed.
 */
export async function brokerApproveDocument(input: {
  dealDocumentId: string;
  dealId: string;
  actorUserId: string;
  nextStatus: "approved" | "broker_review" | "exported";
}): Promise<void> {
  if (!dealExecutionFlags.brokerReviewWorkflowV1) {
    throw new Error("broker_review_workflow_disabled");
  }
  await setDocumentWorkflowStatus(input.dealDocumentId, input.nextStatus, input.actorUserId);
  await recordDocumentVersion({
    dealDocumentId: input.dealDocumentId,
    source: "broker_edit",
    changesSummary: { action: "broker_approval_gate", nextStatus: input.nextStatus },
    createdById: input.actorUserId,
  });
  await logApprovalAction({
    dealId: input.dealId,
    actorUserId: input.actorUserId,
    actionKey: "broker_document_status",
    payload: { dealDocumentId: input.dealDocumentId, nextStatus: input.nextStatus },
  });
  await logDealExecutionEvent({
    eventType: "review_completed",
    userId: input.actorUserId,
    dealId: input.dealId,
    metadata: { dealDocumentId: input.dealDocumentId, status: input.nextStatus },
  });
}

export async function resolveCopilotSuggestion(input: {
  dealId: string;
  suggestionId: string;
  actorUserId: string;
  status: "approved" | "rejected";
  note?: string;
}): Promise<void> {
  const row = await prisma.dealCopilotSuggestion.findFirst({
    where: { id: input.suggestionId, dealId: input.dealId },
  });
  if (!row) throw new Error("suggestion_not_found");
  await prisma.dealCopilotSuggestion.update({
    where: { id: row.id },
    data: {
      status: input.status,
      resolvedAt: new Date(),
      resolvedById: input.actorUserId,
    },
  });
  await prisma.dealExecutionAuditLog.create({
    data: {
      dealId: input.dealId,
      actorUserId: input.actorUserId,
      actionKey: input.status === "approved" ? "copilot_suggestion_approved" : "copilot_suggestion_rejected",
      payload: { suggestionId: input.suggestionId, note: input.note ?? null } as Prisma.InputJsonValue,
    },
  });
  await logDealExecutionEvent({
    eventType: input.status === "approved" ? "clause_suggestion_approved" : "clause_suggestion_rejected",
    userId: input.actorUserId,
    dealId: input.dealId,
    metadata: { suggestionId: input.suggestionId },
  });
}
