/**
 * AI Operations – decision engine: evaluate + fraud + trust → recommendedAction.
 * Used by the queue to suggest approve | flag | block | review. Never auto-deletes; audit in ai_logs.
 */
import { prisma } from "@/lib/db";
import { evaluate } from "./engine";
import { fraudCheckEntity, fraudCheckListing } from "./fraud";
import { getTrustScore } from "./trust";
import { updateQueueStatus, getQueueItem } from "./queue";
import { logAiDecision } from "./logger";
import type { QueueItemType, RecommendedAction } from "./queue";

export type DecisionResult = {
  recommendedAction: RecommendedAction;
  riskScore: number;
  trustScore: number;
  trustLevel: string;
  factors: string[];
  fraudAction?: "allow" | "review" | "block";
};

const entityTypeMap: Record<QueueItemType, "listing" | "booking" | "user"> = {
  listing: "listing",
  booking: "booking",
  user: "user",
  dispute: "user", // dispute: evaluate related user/booking when we have id
};

/** Run full AI pipeline for a queue item and return recommended action. */
export async function runDecisionForItem(
  queueItemId: string,
  options?: { log?: boolean; updateQueue?: boolean }
): Promise<DecisionResult | null> {
  const item = await getQueueItem(queueItemId);
  if (!item) return null;

  const { type, entityId } = item;
  const factors: string[] = [];
  let riskScore = 0;
  let trustScore = 0;
  let trustLevel = "medium";
  let fraudAction: "allow" | "review" | "block" = "allow";

  try {
    const entityType = entityTypeMap[type];
    if (type === "dispute") {
      const evalResult = await evaluate({ entityType: "booking", entityId, log: false }).catch(() => null);
      if (evalResult) {
        riskScore = Math.max(riskScore, evalResult.riskScore);
        factors.push(...evalResult.factors);
      }
    } else {
      const trustEntityId =
      type === "booking"
        ? (await prisma.booking.findUnique({ where: { id: entityId }, select: { guestId: true } }))?.guestId ?? entityId
        : entityId;
    const trustEntityType = type === "listing" ? "listing" : "user";

    const [evalResult, fraudResult, trustResult] = await Promise.all([
        evaluate({ entityType, entityId, log: false }),
        type === "listing"
          ? fraudCheckListing(entityId, { log: false })
          : fraudCheckEntity({
              entityType: type === "booking" ? "BOOKING" : "USER",
              entityId,
              log: false,
            }),
        getTrustScore({
          entityType: trustEntityType,
          entityId: trustEntityId,
          log: false,
        }).catch(() => ({ trustScore: 0, trustLevel: "medium" as const })),
      ]);

      riskScore = Math.max(riskScore, evalResult.riskScore, fraudResult.riskScore);
      trustScore = trustResult.trustScore;
      trustLevel = trustResult.trustLevel;
      fraudAction = fraudResult.recommendedAction;
      factors.push(...evalResult.factors);
      factors.push(`Fraud: ${fraudResult.recommendedAction}`);
    }
  } catch (e) {
    factors.push(e instanceof Error ? e.message : "Evaluation error");
    riskScore = Math.min(100, riskScore + 50);
  }

  const recommendedAction: RecommendedAction =
    riskScore >= 70 || fraudAction === "block"
      ? "block"
      : riskScore >= 50 || fraudAction === "review"
        ? "flag"
        : trustLevel === "low"
          ? "review"
          : "approve";

  if (options?.log !== false) {
    await logAiDecision({
      action: "decision",
      entityType: type,
      entityId,
      riskScore,
      trustLevel,
      trustScore,
      details: {
        decision: recommendedAction,
        factors,
        fraudAction,
        queueItemId,
      },
    });
  }

  if (options?.updateQueue !== false) {
    await updateQueueStatus(queueItemId, item.status, {
      recommendedAction,
      riskScore,
      trustScore,
      details: { riskScore, trustScore, trustLevel, factors },
    });
  }

  return {
    recommendedAction,
    riskScore,
    trustScore,
    trustLevel,
    factors,
    fraudAction,
  };
}

/** Get recommended action for an item (runs decision pipeline if needed). */
export async function getRecommendedAction(queueItemId: string): Promise<DecisionResult | null> {
  return runDecisionForItem(queueItemId, { log: true, updateQueue: true });
}
