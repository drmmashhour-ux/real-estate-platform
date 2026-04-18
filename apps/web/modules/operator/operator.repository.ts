import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { oneBrainV2Flags } from "@/config/feature-flags";
import { recordOperatorRecommendationLearningHint } from "@/modules/growth/unified-learning.service";
import type { BrainLearningSource, BrainOutcomeRecord, BrainOutcomeType } from "@/modules/platform-core/brain-v2.types";
import { createDecisionOutcomes } from "@/modules/platform-core/brain-v2.repository";
import type { AssistantRecommendation, RecommendationConflict, ApprovalStatus } from "./operator.types";

export type SaveRecommendationsResult = {
  saved: number;
  skippedDeduped: number;
  warnings: string[];
};

function rowToAssistant(row: {
  id: string;
  source: string;
  actionType: string;
  targetId: string | null;
  targetLabel: string | null;
  title: string;
  summary: string;
  reason: string;
  confidenceScore: number;
  confidenceLabel: string;
  evidenceScore: number | null;
  evidenceQuality: string | null;
  expectedImpact: string | null;
  operatorAction: string | null;
  blockers: unknown;
  warnings: unknown;
  metrics: unknown;
  createdAt: Date;
}): AssistantRecommendation {
  return {
    id: row.id,
    source: row.source as AssistantRecommendation["source"],
    actionType: row.actionType as AssistantRecommendation["actionType"],
    targetId: row.targetId,
    targetLabel: row.targetLabel,
    title: row.title,
    summary: row.summary,
    reason: row.reason,
    confidenceScore: row.confidenceScore,
    confidenceLabel: row.confidenceLabel as AssistantRecommendation["confidenceLabel"],
    evidenceScore: row.evidenceScore,
    evidenceQuality: row.evidenceQuality as AssistantRecommendation["evidenceQuality"],
    expectedImpact: row.expectedImpact,
    operatorAction: row.operatorAction,
    blockers: Array.isArray(row.blockers) ? (row.blockers as string[]) : undefined,
    warnings: Array.isArray(row.warnings) ? (row.warnings as string[]) : undefined,
    metrics: row.metrics && typeof row.metrics === "object" ? (row.metrics as Record<string, unknown>) : undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function saveRecommendations(
  recommendations: AssistantRecommendation[],
): Promise<SaveRecommendationsResult> {
  const warnings: string[] = [];
  let saved = 0;
  let skippedDeduped = 0;

  for (const rec of recommendations) {
    try {
      await prisma.operatorRecommendationLog.upsert({
        where: { id: rec.id },
        create: {
          id: rec.id,
          source: rec.source,
          actionType: rec.actionType,
          targetId: rec.targetId ?? undefined,
          targetLabel: rec.targetLabel ?? undefined,
          title: rec.title,
          summary: rec.summary,
          reason: rec.reason,
          confidenceScore: rec.confidenceScore,
          confidenceLabel: rec.confidenceLabel,
          evidenceScore: rec.evidenceScore ?? undefined,
          evidenceQuality: rec.evidenceQuality ?? undefined,
          expectedImpact: rec.expectedImpact ?? undefined,
          operatorAction: rec.operatorAction ?? undefined,
          blockers: rec.blockers ? (rec.blockers as Prisma.InputJsonValue) : undefined,
          warnings: rec.warnings ? (rec.warnings as Prisma.InputJsonValue) : undefined,
          metrics: rec.metrics ? (rec.metrics as Prisma.InputJsonValue) : undefined,
        },
        update: {
          summary: rec.summary,
          reason: rec.reason,
          confidenceScore: rec.confidenceScore,
          confidenceLabel: rec.confidenceLabel,
          evidenceScore: rec.evidenceScore ?? undefined,
          evidenceQuality: rec.evidenceQuality ?? undefined,
          expectedImpact: rec.expectedImpact ?? undefined,
          operatorAction: rec.operatorAction ?? undefined,
          blockers: rec.blockers ? (rec.blockers as Prisma.InputJsonValue) : undefined,
          warnings: rec.warnings ? (rec.warnings as Prisma.InputJsonValue) : undefined,
          metrics: rec.metrics ? (rec.metrics as Prisma.InputJsonValue) : undefined,
        },
      });
      saved += 1;
    } catch (e) {
      warnings.push(`Failed to persist recommendation ${rec.id}: ${e instanceof Error ? e.message : String(e)}`);
      skippedDeduped += 1;
    }
  }

  return { saved, skippedDeduped, warnings };
}

export async function saveApproval(
  recommendationId: string,
  status: ApprovalStatus,
  reviewerUserId?: string | null,
  reviewerNote?: string | null,
): Promise<{ id: string }> {
  const row = await prisma.operatorRecommendationApproval.create({
    data: {
      recommendationId,
      status,
      reviewerUserId: reviewerUserId ?? undefined,
      reviewerNote: reviewerNote ?? undefined,
    },
    select: { id: true },
  });
  return row;
}

export async function listRecommendations(limit = 80): Promise<AssistantRecommendation[]> {
  const rows = await prisma.operatorRecommendationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(rowToAssistant);
}

export async function listPendingApprovals(limit = 50) {
  return prisma.operatorRecommendationApproval.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { recommendation: true },
  });
}

export async function getRecommendationById(id: string): Promise<AssistantRecommendation | null> {
  const row = await prisma.operatorRecommendationLog.findUnique({ where: { id } });
  if (!row) return null;
  return rowToAssistant(row);
}

export async function listApprovalsForRecommendation(recommendationId: string) {
  return prisma.operatorRecommendationApproval.findMany({
    where: { recommendationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function saveConflictSnapshots(conflicts: RecommendationConflict[]): Promise<{ saved: number }> {
  let saved = 0;
  for (const c of conflicts) {
    await prisma.operatorConflictSnapshot.create({
      data: {
        targetId: c.targetId ?? undefined,
        actionTypes: c.actionTypes as unknown as object,
        sources: c.sources as unknown as object,
        severity: c.severity,
        reason: c.reason,
      },
    });
    saved += 1;
  }
  return { saved };
}

export async function listRecentConflicts(limit = 40) {
  return prisma.operatorConflictSnapshot.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

function logSourceToBrain(source: string): BrainLearningSource {
  const allowed: BrainLearningSource[] = ["ADS", "CRO", "RETARGETING", "AB_TEST", "PROFIT", "MARKETPLACE", "UNIFIED"];
  return allowed.includes(source as BrainLearningSource) ? (source as BrainLearningSource) : "UNIFIED";
}

/**
 * Persists lifecycle feedback for a recommendation and forwards hints to unified learning + Brain V2 outcomes (when enabled).
 * Does not execute external mutations.
 */
export async function recordRecommendationOutcome(input: {
  recommendationId: string;
  approved?: boolean;
  executed?: boolean;
  success?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const log = await prisma.operatorRecommendationLog.findUnique({ where: { id: input.recommendationId } });
  if (!log) return;

  const prevMeta =
    log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata) ?
      (log.metadata as Record<string, unknown>)
    : {};
  const outcomes = Array.isArray(prevMeta.operatorOutcomes) ? [...(prevMeta.operatorOutcomes as unknown[])] : [];
  outcomes.push({
    at: new Date().toISOString(),
    approved: input.approved,
    executed: input.executed,
    success: input.success,
    ...input.metadata,
  });

  await prisma.operatorRecommendationLog.update({
    where: { id: input.recommendationId },
    data: { metadata: { ...prevMeta, operatorOutcomes: outcomes } as Prisma.InputJsonValue },
  });

  recordOperatorRecommendationLearningHint({
    recommendationId: input.recommendationId,
    approved: input.approved,
    executed: input.executed,
    success: input.success,
  });

  if (!oneBrainV2Flags.oneBrainV2OutcomeIngestionV1) return;

  let outcomeType: BrainOutcomeType;
  let outcomeScore: number;
  let reason: string;
  if (input.executed && input.success === true) {
    outcomeType = "POSITIVE";
    outcomeScore = 0.38;
    reason = "Operator recommendation marked executed successfully (human-confirmed).";
  } else if (input.executed && input.success === false) {
    outcomeType = "NEGATIVE";
    outcomeScore = -0.36;
    reason = "Operator recommendation execution reported as unsuccessful.";
  } else if (input.approved === false) {
    outcomeType = "NEGATIVE";
    outcomeScore = -0.27;
    reason = "Operator recommendation dismissed — negative prior for similar signals.";
  } else if (input.approved === true) {
    outcomeType = "NEUTRAL";
    outcomeScore = 0.14;
    reason = "Operator recommendation approved — neutral prior until downstream metrics confirm.";
  } else {
    outcomeType = "NEUTRAL";
    outcomeScore = 0.05;
    reason = "Operator recommendation outcome recorded (metadata-only).";
  }

  const o: BrainOutcomeRecord = {
    decisionId: `operator-rec:${input.recommendationId}`,
    source: logSourceToBrain(log.source),
    entityType: "OPERATOR_RECOMMENDATION",
    entityId: log.targetId,
    actionType: log.actionType,
    outcomeType,
    outcomeScore,
    observedMetrics: {
      operatorLifecycle: true,
      ...input.metadata,
    },
    reason,
    createdAt: new Date().toISOString(),
  };

  await createDecisionOutcomes([o]);
}
