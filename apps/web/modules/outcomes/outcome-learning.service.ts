import { prisma } from "@repo/db";

import type { LecipmOutcomesSummary } from "./outcome.types";

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * Appends PROPOSED audit rows when drift/accuracy warrants review — never mutates live brain weights.
 */
export async function maybeAppendLearningProposals(summary: LecipmOutcomesSummary): Promise<void> {
  if (summary.sampleSize < 12) return;
  const acc = summary.predictionAccuracy;
  if (acc == null || acc > 0.62) return;

  const recent = await prisma.lecipmLearningFeedbackAudit.findFirst({
    where: { domain: "system_calibration", status: "PROPOSED" },
    orderBy: { createdAt: "desc" },
  });
  if (recent && Date.now() - recent.createdAt.getTime() < COOLDOWN_MS) return;

  await prisma.lecipmLearningFeedbackAudit.create({
    data: {
      status: "PROPOSED",
      domain: "system_calibration",
      requiresReview: true,
      payload: {
        kind: "threshold_review",
        observedAccuracy: acc,
        drift: summary.drift,
        windowDays: summary.windowDays,
        suggestedNextSteps: [
          "Review deal intelligence priors vs. pipeline_won / pipeline_lost events",
          "Validate trust_engine comparison labels against dispute outcomes",
          "Compare scenario_autopilot outcomeJson deltas to baselines",
        ],
        riskTier: "medium",
      },
    },
  });
}

/**
 * Records a human or tool-initiated rollback intent (append-only new row; does not rewrite history).
 */
export async function recordLearningRollback(params: {
  supersedesId: string;
  previousPayload: unknown;
  note: string;
  actorUserId?: string;
}) {
  await prisma.lecipmLearningFeedbackAudit.create({
    data: {
      status: "ROLLED_BACK",
      domain: "system_calibration",
      requiresReview: true,
      supersedesId: params.supersedesId,
      previousPayload: params.previousPayload as object,
      note: params.note,
      createdByUserId: params.actorUserId,
      payload: {
        kind: "rollback_marker",
        targetId: params.supersedesId,
      },
    },
  });
}
