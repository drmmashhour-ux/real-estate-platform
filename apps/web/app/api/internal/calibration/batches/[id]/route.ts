import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { computeSegmentPerformanceBreakdown } from "@/modules/continuous-calibration/infrastructure/calibrationMetricsService";
import { getCalibrationBatch } from "@/modules/continuous-calibration/infrastructure/calibrationRepository";
import { requirePlatformAdmin } from "../../../model-validation/_auth";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });

  const { id } = await context.params;
  const batch = await getCalibrationBatch(prisma, id);
  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const segments = computeSegmentPerformanceBreakdown(batch.items);

  return NextResponse.json({
    segments,
    batch: {
      id: batch.id,
      name: batch.name,
      description: batch.description,
      status: batch.status,
      sourceValidationRunIds: batch.sourceValidationRunIds,
      activeTuningProfileId: batch.activeTuningProfileId,
      activeTuningProfile: batch.activeTuningProfile,
      listingCount: batch.listingCount,
      targetMinItems: batch.targetMinItems,
      targetMaxItems: batch.targetMaxItems,
      compositionTargets: batch.compositionTargets,
      metricsJson: batch.metricsJson,
      driftSummaryJson: batch.driftSummaryJson,
      tuningReviewRecommended: batch.tuningReviewRecommended,
      tuningReviewReasonsJson: batch.tuningReviewReasonsJson,
      tuningProposed: batch.tuningProposed,
      tuningApplied: batch.tuningApplied,
      createdBy: batch.createdBy,
      createdAt: batch.createdAt.toISOString(),
      completedAt: batch.completedAt?.toISOString() ?? null,
    },
    items: batch.items.map((i) => ({
      id: i.id,
      entityType: i.entityType,
      entityId: i.entityId,
      sourceRunId: i.sourceRunId,
      predictedTrustScore: i.predictedTrustScore,
      predictedTrustConfidence: i.predictedTrustConfidence,
      predictedDealScore: i.predictedDealScore,
      predictedDealConfidence: i.predictedDealConfidence,
      predictedFraudScore: i.predictedFraudScore,
      predictedRecommendation: i.predictedRecommendation,
      humanTrustLabel: i.humanTrustLabel,
      humanDealLabel: i.humanDealLabel,
      humanRiskLabel: i.humanRiskLabel,
      fairnessRating: i.fairnessRating,
      needsManualReview: i.needsManualReview,
      segmentJson: i.segmentJson,
    })),
    driftAlerts: batch.driftAlerts.map((a) => ({
      id: a.id,
      alertType: a.alertType,
      severity: a.severity,
      metricName: a.metricName,
      previousValue: a.previousValue,
      currentValue: a.currentValue,
      thresholdValue: a.thresholdValue,
      message: a.message,
      status: a.status,
      segmentKey: a.segmentKey,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}
