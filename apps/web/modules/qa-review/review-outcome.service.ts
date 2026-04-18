import type { QaReviewOutcome, QaReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { complianceAuditKeys, logComplianceAudit } from "@/lib/admin/compliance-audit";

export async function setReviewOutcome(
  reviewId: string,
  actorUserId: string,
  input: { outcome: QaReviewOutcome; status?: QaReviewStatus; notes?: Record<string, unknown> },
) {
  const row = await prisma.qaReview.update({
    where: { id: reviewId },
    data: {
      outcome: input.outcome,
      status: input.status ?? "completed",
      notes: (input.notes ?? {}) as object,
    },
  });

  await logComplianceAudit({
    actorUserId,
    actionKey:
      input.outcome === "changes_required"
        ? complianceAuditKeys.changesRequested
        : complianceAuditKeys.reviewCompleted,
    reviewId,
    payload: { outcome: input.outcome },
  });

  return row;
}
