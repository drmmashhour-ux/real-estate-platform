import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { FRAUD_FLAG_STRENGTH_FLOOR, FRAUD_RISK_THRESHOLDS } from "@/src/modules/fraud/fraud.rules";
import type { FraudEntityType, FraudScoreComputation } from "@/src/modules/fraud/types";

/** Per-signal severity — aligned with aggregate `classifyRiskLevel` bands. */
function severityFromStrength(strength: number): "low" | "medium" | "high" | "critical" {
  if (strength >= FRAUD_RISK_THRESHOLDS.critical) return "critical";
  if (strength >= FRAUD_RISK_THRESHOLDS.high) return "high";
  if (strength >= FRAUD_RISK_THRESHOLDS.medium) return "medium";
  return "low";
}

/**
 * Persist explainable open flags from scored signals; refresh matching open rows.
 */
export async function createOrUpdateFraudFlags(
  entityType: FraudEntityType,
  entityId: string,
  scoreResult: FraudScoreComputation
): Promise<void> {
  for (const s of scoreResult.signals) {
    if (s.normalizedStrength < FRAUD_FLAG_STRENGTH_FLOOR) continue;
    const severity = severityFromStrength(s.normalizedStrength);
    const existing = await prisma.fraudFlag.findFirst({
      where: {
        entityType,
        entityId,
        flagType: s.code,
        status: "open",
      },
    });
    const details = {
      explanation: s.humanExplanation,
      strength: s.normalizedStrength,
      details: s.details,
      overallRiskLevel: scoreResult.riskLevel,
      overallRiskScore: scoreResult.riskScore,
      reviewHint:
        scoreResult.riskLevel === "critical" || scoreResult.riskLevel === "high"
          ? "Escalate if payment or identity-adjacent."
          : "Pattern signal — confirm context before enforcement.",
    };
    if (existing) {
      await prisma.fraudFlag.update({
        where: { id: existing.id },
        data: {
          severity,
          detailsJson: details as Prisma.InputJsonValue,
        },
      });
    } else {
      await prisma.fraudFlag.create({
        data: {
          entityType,
          entityId,
          flagType: s.code,
          severity,
          status: "open",
          detailsJson: details as Prisma.InputJsonValue,
        },
      });
    }
  }

  if (scoreResult.riskLevel === "low") return;

  const openCount = await prisma.fraudFlag.count({
    where: { entityType, entityId, status: "open" },
  });

  if (scoreResult.riskLevel === "medium") {
    if (openCount >= 3) {
      await enqueueFraudReview(
        entityType,
        entityId,
        20 + openCount * 5,
        `Medium aggregate risk with ${openCount} concurrent open flags.`
      );
    }
    return;
  }

  const priority =
    scoreResult.riskLevel === "critical" ? 80 + openCount * 5 : 50 + openCount * 5;
  await enqueueFraudReview(
    entityType,
    entityId,
    priority,
    `${scoreResult.riskLevel.toUpperCase()} fraud risk (${scoreResult.riskScore.toFixed(2)}): review evidence bundle.`
  );
}

/**
 * Dedupe: one pending/in_review queue row per entity; bump priority if repeated.
 */
export async function enqueueFraudReview(
  entityType: FraudEntityType,
  entityId: string,
  priority: number,
  reasonSummary: string
): Promise<void> {
  const existing = await prisma.fraudReviewQueue.findFirst({
    where: {
      entityType,
      entityId,
      status: { in: ["pending", "in_review"] },
    },
  });
  if (existing) {
    await prisma.fraudReviewQueue.update({
      where: { id: existing.id },
      data: {
        priority: Math.max(existing.priority, priority),
        reasonSummary:
          existing.reasonSummary.length < 400
            ? `${existing.reasonSummary} | ${reasonSummary}`
            : existing.reasonSummary,
      },
    });
    return;
  }
  await prisma.fraudReviewQueue.create({
    data: {
      entityType,
      entityId,
      priority,
      reasonSummary,
      status: "pending",
    },
  });
}

export type ResolveFraudFlagAction =
  | "reviewed"
  | "dismissed"
  | "confirmed"
  | "actioned"
  | "request_verification"
  | "trust_review"
  | "ranking_penalty_note";

export async function resolveFraudFlag(
  flagId: string,
  adminUserId: string,
  action: ResolveFraudFlagAction,
  notes?: string
): Promise<void> {
  const flag = await prisma.fraudFlag.findUnique({ where: { id: flagId } });
  if (!flag) throw new Error("Flag not found");

  let status = flag.status;
  if (action === "dismissed") status = "dismissed";
  else if (action === "confirmed") status = "confirmed";
  else if (action === "reviewed") status = "reviewed";
  else if (action === "actioned" || action === "request_verification" || action === "trust_review") {
    status = "actioned";
  } else if (action === "ranking_penalty_note") {
    status = "reviewed";
  }

  await prisma.fraudFlag.update({
    where: { id: flagId },
    data: {
      status,
      reviewedById: adminUserId,
      reviewedAt: new Date(),
      detailsJson: {
        ...(typeof flag.detailsJson === "object" && flag.detailsJson !== null ? flag.detailsJson : {}),
        resolution: { action, notes: notes ?? null, at: new Date().toISOString() },
      },
    },
  });

  await prisma.fraudActionLog.create({
    data: {
      entityType: flag.entityType,
      entityId: flag.entityId,
      actionType: `flag_resolve:${action}`,
      resultJson: { flagId, notes: notes ?? null },
    },
  });
}
