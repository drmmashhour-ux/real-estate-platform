import type { Prisma, PrismaClient } from "@prisma/client";
import type { ModelValidationRunStatus } from "@prisma/client";
import type { AddValidationItemInput, CreateValidationRunInput } from "../domain/validation.types";
import { computeAllAgreements } from "./agreementService";

export async function createRun(
  db: PrismaClient,
  input: CreateValidationRunInput & { status?: ModelValidationRunStatus },
) {
  return db.modelValidationRun.create({
    data: {
      name: input.name ?? null,
      description: input.description ?? null,
      createdBy: input.createdBy ?? null,
      status: input.status ?? "draft",
      validationRunKind: input.validationRunKind ?? "baseline",
      appliedTuningProfileId: input.appliedTuningProfileId ?? null,
      comparisonTargetRunId: input.comparisonTargetRunId ?? null,
    },
  });
}

export async function listRuns(db: PrismaClient, take = 60) {
  return db.modelValidationRun.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: {
      _count: { select: { items: true } },
      appliedTuningProfile: { select: { id: true, name: true } },
    },
  });
}

export async function getRun(db: PrismaClient, runId: string) {
  return db.modelValidationRun.findUnique({ where: { id: runId } });
}

export async function getRunWithItems(db: PrismaClient, runId: string) {
  return db.modelValidationRun.findUnique({
    where: { id: runId },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });
}

export async function upsertValidationRunComparison(
  db: PrismaClient,
  input: {
    baseRunId: string;
    comparisonRunId: string;
    metricsDelta: Prisma.InputJsonValue;
    summary: Prisma.InputJsonValue;
  },
) {
  return db.validationRunComparison.upsert({
    where: {
      baseRunId_comparisonRunId: {
        baseRunId: input.baseRunId,
        comparisonRunId: input.comparisonRunId,
      },
    },
    create: {
      baseRunId: input.baseRunId,
      comparisonRunId: input.comparisonRunId,
      metricsDelta: input.metricsDelta,
      summary: input.summary,
    },
    update: {
      metricsDelta: input.metricsDelta,
      summary: input.summary,
    },
  });
}

export async function findComparisonsInvolvingRun(db: PrismaClient, runId: string) {
  return db.validationRunComparison.findMany({
    where: {
      OR: [{ baseRunId: runId }, { comparisonRunId: runId }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      baseRun: { select: { id: true, name: true, validationRunKind: true } },
      comparisonRun: { select: { id: true, name: true, validationRunKind: true } },
    },
  });
}

export async function updateItem(
  db: PrismaClient,
  runId: string,
  itemId: string,
  input: Partial<AddValidationItemInput>,
) {
  const row = await db.modelValidationItem.findFirst({
    where: { id: itemId, runId },
  });
  if (!row) return null;

  const mergedForAgreement = {
    predictedTrustScore: input.predictedTrustScore ?? row.predictedTrustScore,
    predictedFraudScore: input.predictedFraudScore ?? row.predictedFraudScore,
    predictedRecommendation: input.predictedRecommendation ?? row.predictedRecommendation,
    humanTrustLabel: input.humanTrustLabel !== undefined ? input.humanTrustLabel : row.humanTrustLabel,
    humanDealLabel: input.humanDealLabel !== undefined ? input.humanDealLabel : row.humanDealLabel,
    humanRiskLabel: input.humanRiskLabel !== undefined ? input.humanRiskLabel : row.humanRiskLabel,
  };

  const agreements = computeAllAgreements({
    predictedTrustScore: mergedForAgreement.predictedTrustScore,
    predictedRecommendation: mergedForAgreement.predictedRecommendation,
    predictedFraudScore: mergedForAgreement.predictedFraudScore,
    humanTrustLabel: mergedForAgreement.humanTrustLabel,
    humanDealLabel: mergedForAgreement.humanDealLabel,
    humanRiskLabel: mergedForAgreement.humanRiskLabel,
  });

  return db.modelValidationItem.update({
    where: { id: itemId },
    data: {
      ...(input.predictedTrustScore !== undefined ? { predictedTrustScore: input.predictedTrustScore } : {}),
      ...(input.predictedTrustConfidence !== undefined ? { predictedTrustConfidence: input.predictedTrustConfidence } : {}),
      ...(input.predictedDealScore !== undefined ? { predictedDealScore: input.predictedDealScore } : {}),
      ...(input.predictedDealConfidence !== undefined ? { predictedDealConfidence: input.predictedDealConfidence } : {}),
      ...(input.predictedFraudScore !== undefined ? { predictedFraudScore: input.predictedFraudScore } : {}),
      ...(input.predictedRecommendation !== undefined ? { predictedRecommendation: input.predictedRecommendation } : {}),
      ...(input.predictedIssueCodes !== undefined ? { predictedIssueCodes: input.predictedIssueCodes ?? undefined } : {}),
      ...(input.humanTrustLabel !== undefined ? { humanTrustLabel: input.humanTrustLabel } : {}),
      ...(input.humanDealLabel !== undefined ? { humanDealLabel: input.humanDealLabel } : {}),
      ...(input.humanRiskLabel !== undefined ? { humanRiskLabel: input.humanRiskLabel } : {}),
      ...(input.fairnessRating !== undefined ? { fairnessRating: input.fairnessRating } : {}),
      ...(input.wouldPublish !== undefined ? { wouldPublish: input.wouldPublish } : {}),
      ...(input.wouldContact !== undefined ? { wouldContact: input.wouldContact } : {}),
      ...(input.wouldInvestigateFurther !== undefined ? { wouldInvestigateFurther: input.wouldInvestigateFurther } : {}),
      ...(input.needsManualReview !== undefined ? { needsManualReview: input.needsManualReview } : {}),
      ...(input.reviewerNotes !== undefined ? { reviewerNotes: input.reviewerNotes } : {}),
      agreementTrust: agreements.agreementTrust,
      agreementDeal: agreements.agreementDeal,
      agreementRisk: agreements.agreementRisk,
    },
  });
}

export async function addItem(db: PrismaClient, runId: string, input: AddValidationItemInput) {
  const codes = input.predictedIssueCodes ?? undefined;
  const agreements = computeAllAgreements({
    predictedTrustScore: input.predictedTrustScore ?? null,
    predictedRecommendation: input.predictedRecommendation ?? null,
    predictedFraudScore: input.predictedFraudScore ?? null,
    humanTrustLabel: input.humanTrustLabel ?? null,
    humanDealLabel: input.humanDealLabel ?? null,
    humanRiskLabel: input.humanRiskLabel ?? null,
  });

  return db.modelValidationItem.create({
    data: {
      runId,
      entityType: input.entityType,
      entityId: input.entityId,
      predictedTrustScore: input.predictedTrustScore ?? null,
      predictedTrustConfidence: input.predictedTrustConfidence ?? null,
      predictedDealScore: input.predictedDealScore ?? null,
      predictedDealConfidence: input.predictedDealConfidence ?? null,
      predictedFraudScore: input.predictedFraudScore ?? null,
      predictedRecommendation: input.predictedRecommendation ?? null,
      predictedIssueCodes: codes ? codes : undefined,
      humanTrustLabel: input.humanTrustLabel ?? null,
      humanDealLabel: input.humanDealLabel ?? null,
      humanRiskLabel: input.humanRiskLabel ?? null,
      fairnessRating: input.fairnessRating ?? null,
      wouldPublish: input.wouldPublish ?? null,
      wouldContact: input.wouldContact ?? null,
      wouldInvestigateFurther: input.wouldInvestigateFurther ?? null,
      needsManualReview: input.needsManualReview ?? null,
      reviewerNotes: input.reviewerNotes ?? null,
      agreementTrust: agreements.agreementTrust,
      agreementDeal: agreements.agreementDeal,
      agreementRisk: agreements.agreementRisk,
    },
  });
}

export async function updateRunStatus(
  db: PrismaClient,
  runId: string,
  status: ModelValidationRunStatus,
  completedAt?: Date | null,
) {
  return db.modelValidationRun.update({
    where: { id: runId },
    data: {
      status,
      ...(completedAt !== undefined ? { completedAt } : {}),
    },
  });
}

/** Recompute agreements for all items in a run (e.g. after bulk label import). */
export async function refreshAgreementsForRun(db: PrismaClient, runId: string) {
  const items = await db.modelValidationItem.findMany({ where: { runId } });
  for (const row of items) {
    const a = computeAllAgreements({
      predictedTrustScore: row.predictedTrustScore,
      predictedRecommendation: row.predictedRecommendation,
      predictedFraudScore: row.predictedFraudScore,
      humanTrustLabel: row.humanTrustLabel,
      humanDealLabel: row.humanDealLabel,
      humanRiskLabel: row.humanRiskLabel,
    });
    await db.modelValidationItem.update({
      where: { id: row.id },
      data: {
        agreementTrust: a.agreementTrust,
        agreementDeal: a.agreementDeal,
        agreementRisk: a.agreementRisk,
      },
    });
  }
}
