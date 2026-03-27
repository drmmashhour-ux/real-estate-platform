import type { Prisma, PrismaClient } from "@prisma/client";
import type { CalibrationBatchStatus } from "@prisma/client";

export async function getActiveTuningProfile(db: PrismaClient) {
  return db.tuningProfile.findFirst({
    where: { isActive: true },
    orderBy: { appliedAt: "desc" },
  });
}

export async function createCalibrationBatch(
  db: PrismaClient,
  data: {
    name?: string | null;
    description?: string | null;
    sourceValidationRunIds: string[];
    activeTuningProfileId?: string | null;
    targetMinItems?: number | null;
    targetMaxItems?: number | null;
    compositionTargets?: Prisma.InputJsonValue | null;
    createdBy?: string | null;
    status?: CalibrationBatchStatus;
  },
) {
  return db.calibrationBatch.create({
    data: {
      name: data.name ?? null,
      description: data.description ?? null,
      sourceValidationRunIds: data.sourceValidationRunIds,
      activeTuningProfileId: data.activeTuningProfileId ?? null,
      targetMinItems: data.targetMinItems ?? null,
      targetMaxItems: data.targetMaxItems ?? null,
      compositionTargets: data.compositionTargets ?? undefined,
      createdBy: data.createdBy ?? null,
      status: data.status ?? "draft",
      listingCount: 0,
    },
  });
}

export async function getCalibrationBatch(db: PrismaClient, id: string) {
  return db.calibrationBatch.findUnique({
    where: { id },
    include: {
      activeTuningProfile: { select: { id: true, name: true, isActive: true, createdAt: true } },
      items: { orderBy: { createdAt: "asc" } },
      driftAlerts: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function listCalibrationBatches(db: PrismaClient, take = 40) {
  return db.calibrationBatch.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: {
      activeTuningProfile: { select: { id: true, name: true } },
      _count: { select: { items: true, driftAlerts: true } },
    },
  });
}

export async function updateCalibrationBatch(
  db: PrismaClient,
  id: string,
  data: Prisma.CalibrationBatchUpdateInput,
) {
  return db.calibrationBatch.update({ where: { id }, data });
}

export async function createBatchItems(
  db: PrismaClient,
  batchId: string,
  rows: Array<{
    entityType: string;
    entityId: string;
    sourceRunId?: string | null;
    humanTrustLabel: string | null;
    humanDealLabel: string | null;
    humanRiskLabel: string | null;
    fairnessRating: number | null;
    needsManualReview: boolean | null;
    notes?: string | null;
    segmentJson?: Prisma.InputJsonValue | null;
  }>,
) {
  if (!rows.length) return { count: 0 };
  await db.calibrationBatchItem.createMany({
    data: rows.map((r) => ({
      batchId,
      entityType: r.entityType,
      entityId: r.entityId,
      sourceRunId: r.sourceRunId ?? null,
      humanTrustLabel: r.humanTrustLabel,
      humanDealLabel: r.humanDealLabel,
      humanRiskLabel: r.humanRiskLabel,
      fairnessRating: r.fairnessRating,
      needsManualReview: r.needsManualReview,
      notes: r.notes ?? null,
      segmentJson: r.segmentJson ?? undefined,
    })),
  });
  return db.calibrationBatch.update({
    where: { id: batchId },
    data: { listingCount: rows.length },
  });
}

export async function updateBatchItemPredictions(
  db: PrismaClient,
  itemId: string,
  data: {
    predictedTrustScore: number | null;
    predictedTrustConfidence: number | null;
    predictedDealScore: number | null;
    predictedDealConfidence: number | null;
    predictedFraudScore: number | null;
    predictedRecommendation: string | null;
    predictedIssueCodes?: Prisma.InputJsonValue | null;
  },
) {
  return db.calibrationBatchItem.update({
    where: { id: itemId },
    data: {
      predictedTrustScore: data.predictedTrustScore,
      predictedTrustConfidence: data.predictedTrustConfidence,
      predictedDealScore: data.predictedDealScore,
      predictedDealConfidence: data.predictedDealConfidence,
      predictedFraudScore: data.predictedFraudScore,
      predictedRecommendation: data.predictedRecommendation,
      predictedIssueCodes: data.predictedIssueCodes ?? undefined,
    },
  });
}

export async function createDriftAlerts(
  db: PrismaClient,
  batchId: string,
  alerts: Array<{
    alertType: string;
    severity: "info" | "warning" | "critical";
    metricName?: string | null;
    previousValue?: number | null;
    currentValue?: number | null;
    thresholdValue?: number | null;
    message: string;
    segmentKey?: string | null;
  }>,
) {
  if (!alerts.length) return;
  await db.calibrationDriftAlert.createMany({
    data: alerts.map((a) => ({
      batchId,
      alertType: a.alertType,
      severity: a.severity,
      metricName: a.metricName ?? null,
      previousValue: a.previousValue ?? null,
      currentValue: a.currentValue ?? null,
      thresholdValue: a.thresholdValue ?? null,
      message: a.message,
      segmentKey: a.segmentKey ?? null,
    })),
  });
}

export async function listDriftAlerts(
  db: PrismaClient,
  options: { status?: "open" | "acknowledged" | "dismissed"; take?: number } = {},
) {
  return db.calibrationDriftAlert.findMany({
    where: options.status ? { status: options.status } : undefined,
    orderBy: { createdAt: "desc" },
    take: options.take ?? 80,
    include: {
      batch: { select: { id: true, name: true, createdAt: true } },
    },
  });
}

export async function getPreviousCompletedBatchMetrics(db: PrismaClient, beforeCreatedAt: Date) {
  const rows = await db.calibrationBatch.findMany({
    where: {
      status: "completed",
      createdAt: { lt: beforeCreatedAt },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  return rows.find((r) => r.metricsJson != null) ?? null;
}
