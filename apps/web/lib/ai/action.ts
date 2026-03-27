/**
 * AI Operations – execute actions (approve, flag, block, escalate). Never delete data; audit in ai_logs.
 */
import { prisma } from "@/lib/db";
import { updateQueueStatus, getQueueItem } from "./queue";
import { logAiDecision } from "./logger";
import type { QueueItemStatus, RecommendedAction } from "./queue";

export type ActionType = "approve" | "flag" | "block" | "escalate";

export type ActionResult = {
  ok: boolean;
  queueStatus: QueueItemStatus;
  message: string;
};

/** Apply action to a queue item. Updates queue status and optionally entity state. Never deletes. */
export async function executeAction(
  queueItemId: string,
  action: ActionType,
  options?: { riskScore?: number; performedBy?: "ai" | "human" }
): Promise<ActionResult> {
  const item = await getQueueItem(queueItemId);
  if (!item) {
    return { ok: false, queueStatus: "pending", message: "Queue item not found" };
  }

  const { type, entityId } = item;
  const riskScore = options?.riskScore ?? item.riskScore ?? 0;

  const statusByAction: Record<ActionType, QueueItemStatus> = {
    approve: "approved",
    flag: "flagged",
    block: "rejected",
    escalate: "flagged",
  };
  const queueStatus = statusByAction[action];

  await updateQueueStatus(queueItemId, queueStatus, {
    recommendedAction: action === "escalate" ? "review" : action,
    details: {
      ...(typeof item.details === "object" && item.details !== null ? (item.details as object) : {}),
      lastAction: action,
      performedBy: options?.performedBy ?? "human",
      at: new Date().toISOString(),
    },
  });

  if (type === "listing") {
    if (action === "block") {
      await prisma.shortTermListing.updateMany({
        where: { id: entityId },
        data: { listingStatus: "UNDER_INVESTIGATION" },
      }).catch(() => {});
    }
    if (action === "approve") {
      await prisma.shortTermListing.updateMany({
        where: { id: entityId },
        data: { listingVerificationStatus: "VERIFIED", listingStatus: "PUBLISHED" },
      }).catch(() => {});
    }
  }

  if (action === "escalate") {
    await prisma.aiOperatorAlert.create({
      data: {
        alertType: "fraud_risk",
        severity: "high",
        entityType: type,
        entityId,
        message: `Escalated to human from AI queue (${queueItemId}). Risk score: ${riskScore}.`,
        status: "open",
      },
    }).catch(() => {});
  }

  await logAiDecision({
    action: "decision",
    entityType: type,
    entityId,
    riskScore,
    details: {
      decision: action,
      queueItemId,
      queueStatus,
      performedBy: options?.performedBy ?? "human",
    },
  });

  return {
    ok: true,
    queueStatus,
    message: `Action "${action}" applied. Queue status: ${queueStatus}.`,
  };
}
