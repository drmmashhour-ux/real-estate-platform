import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import type { HumanReviewActionType, VerificationCaseStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

const SCORE_MIN = 0;
const SCORE_MAX = 100;

export async function applyHumanReviewAction(params: {
  caseId: string;
  reviewerId: string;
  actionType: HumanReviewActionType;
  notes?: string | null;
  payload?: Record<string, unknown>;
  /** When overriding score (also set actionType to override_score). */
  newOverallScore?: number;
}) {
  const c = await prisma.verificationCase.findUnique({ where: { id: params.caseId } });
  if (!c) throw new Error("Case not found");

  if (params.newOverallScore !== undefined) {
    const s = params.newOverallScore;
    if (!Number.isFinite(s) || s < SCORE_MIN || s > SCORE_MAX) {
      throw new Error(`Score must be between ${SCORE_MIN} and ${SCORE_MAX}`);
    }
  }

  let nextStatus: VerificationCaseStatus = c.status;
  if (params.actionType === "approve") nextStatus = "approved";
  else if (params.actionType === "reject") nextStatus = "rejected";
  else if (params.actionType === "request_info") nextStatus = "needs_info";
  else if (params.actionType === "escalate") nextStatus = "escalated";

  const payload = params.payload ?? {};

  await prisma.$transaction(async (tx) => {
    await tx.humanReviewAction.create({
      data: {
        caseId: params.caseId,
        reviewerId: params.reviewerId,
        actionType: params.actionType,
        notes: params.notes ?? null,
        payload: payload as Prisma.InputJsonValue,
      },
    });

    if (params.actionType === "dismiss_signal" && typeof payload.signalId === "string") {
      await tx.verificationSignal.updateMany({
        where: { id: payload.signalId, caseId: params.caseId },
        data: { status: "dismissed" },
      });
    }

    await tx.verificationCase.update({
      where: { id: params.caseId },
      data: {
        status: nextStatus,
        resolvedAt: nextStatus === "approved" || nextStatus === "rejected" ? new Date() : undefined,
        ...(params.newOverallScore !== undefined ? { overallScore: Math.round(params.newOverallScore) } : {}),
        ...(params.actionType === "assign" && typeof payload.assignedToId === "string"
          ? { assignedTo: payload.assignedToId as string }
          : {}),
      },
    });
  });

  void recordPlatformEvent({
    eventType: "trustgraph_human_review",
    sourceModule: "trustgraph",
    entityType: "VERIFICATION_CASE",
    entityId: params.caseId,
    payload: {
      actionType: params.actionType,
      reviewerId: params.reviewerId,
      nextStatus,
      ...(params.actionType === "override_score" && params.newOverallScore !== undefined
        ? { newOverallScore: Math.round(params.newOverallScore) }
        : {}),
    },
  }).catch(() => {});

  return { ok: true as const };
}
