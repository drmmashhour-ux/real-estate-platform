import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type SuggestionApprovalAction = "approve" | "reject" | "edit_then_approve" | "snooze";

/**
 * Structured approval trail for drafting/copilot suggestions — stored in `DealExecutionAuditLog` (no parallel truth).
 */
export async function logSuggestionApproval(input: {
  dealId: string;
  actorUserId: string;
  suggestionType: string;
  action: SuggestionApprovalAction;
  suggestionPayload: Record<string, unknown>;
  documentId?: string | null;
  sourceSnapshot?: Record<string, unknown> | null;
}): Promise<void> {
  await prisma.dealExecutionAuditLog.create({
    data: {
      dealId: input.dealId,
      actorUserId: input.actorUserId,
      actionKey: `suggestion_${input.action}`,
      payload: {
        suggestionType: input.suggestionType,
        documentId: input.documentId ?? null,
        sourceSnapshot: input.sourceSnapshot ?? null,
        suggestionPayload: input.suggestionPayload,
      } as Prisma.InputJsonValue,
    },
  });
}
