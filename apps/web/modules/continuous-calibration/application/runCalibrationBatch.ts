import type { PrismaClient } from "@prisma/client";
import type { TuningProfileConfig } from "@/modules/scoring/tuningProfile";
import { isDealAnalyzerEnabled } from "@/modules/deal-analyzer/config";
import { calculateDealScore } from "@/modules/deal-score/application/calculateDealScore";
import { calculateFraudScore } from "@/modules/fraud-risk/application/calculateFraudScore";
import { calculateTrustScore } from "@/modules/trust-score/application/calculateTrustScore";
import type { CalibrationBatchMetricsSnapshot } from "../domain/calibration.types";
import { detectModelDriftAndPersist } from "./detectModelDrift";
import { recommendTuningReview } from "./recommendTuningReview";
import {
  getCalibrationBatch,
  getPreviousCompletedBatchMetrics,
  updateCalibrationBatch,
  updateBatchItemPredictions,
} from "../infrastructure/calibrationRepository";
import {
  computeBatchMetricsSnapshot,
  computeSegmentPerformanceBreakdown,
} from "../infrastructure/calibrationMetricsService";

async function scoreListingForBatch(
  db: PrismaClient,
  listingId: string,
  tuning: TuningProfileConfig | null,
): Promise<{
  predictedTrustScore: number | null;
  predictedTrustConfidence: number | null;
  predictedDealScore: number | null;
  predictedDealConfidence: number | null;
  predictedFraudScore: number | null;
  predictedRecommendation: string | null;
  predictedIssueCodes: string[] | null;
}> {
  const fraud = await calculateFraudScore(db, listingId);
  const codes: string[] = fraud?.signals?.map((s) => s.code) ?? [];
  const trust = await calculateTrustScore(db, listingId, { persist: false, tuning });
  if (trust) codes.push(...trust.issueCodes);

  let predictedDealScore: number | null = null;
  let predictedDealConfidence: number | null = null;
  let predictedRecommendation: string | null = null;

  if (isDealAnalyzerEnabled()) {
    const deal = await calculateDealScore(listingId, { persist: false, tuning });
    if (deal) {
      predictedDealScore = deal.dealScore;
      predictedDealConfidence = deal.dealConfidence;
      predictedRecommendation = deal.recommendation;
    }
  }

  return {
    predictedTrustScore: trust?.trustScore ?? null,
    predictedTrustConfidence: trust?.trustConfidence ?? null,
    predictedDealScore,
    predictedDealConfidence,
    predictedFraudScore: fraud?.fraudScore ?? null,
    predictedRecommendation,
    predictedIssueCodes: codes.length ? [...new Set(codes)].slice(0, 48) : null,
  };
}

function parsePreviousMetrics(row: { metricsJson: unknown } | null): CalibrationBatchMetricsSnapshot | null {
  if (!row?.metricsJson || typeof row.metricsJson !== "object") return null;
  return row.metricsJson as CalibrationBatchMetricsSnapshot;
}

export async function runCalibrationBatch(db: PrismaClient, batchId: string) {
  const batch = await getCalibrationBatch(db, batchId);
  if (!batch) throw new Error("Batch not found");
  if (batch.status === "running") throw new Error("Batch is already running");
  if (batch.status === "completed") throw new Error("Batch already completed");

  await updateCalibrationBatch(db, batchId, { status: "running", completedAt: null });

  let tuning: TuningProfileConfig | null = null;
  if (batch.activeTuningProfileId) {
    const profile = await db.tuningProfile.findUnique({ where: { id: batch.activeTuningProfileId } });
    if (profile) tuning = profile.config as TuningProfileConfig;
  }

  try {
    for (const item of batch.items) {
      if (item.entityType !== "fsbo_listing") continue;
      const preds = await scoreListingForBatch(db, item.entityId, tuning);
      await updateBatchItemPredictions(db, item.id, {
        ...preds,
        predictedIssueCodes: preds.predictedIssueCodes,
      });
    }

    const fresh = await getCalibrationBatch(db, batchId);
    if (!fresh) throw new Error("Batch not found after scoring");

    const metrics = computeBatchMetricsSnapshot(fresh.items);
    const segments = computeSegmentPerformanceBreakdown(fresh.items);

    const prevRow = await getPreviousCompletedBatchMetrics(db, fresh.createdAt);
    const previousMetrics = parsePreviousMetrics(prevRow);

    const { alerts, summary } = await detectModelDriftAndPersist(db, {
      batchId,
      currentMetrics: metrics,
      previousMetrics,
      segments,
    });

    const review = recommendTuningReview(alerts);

    await updateCalibrationBatch(db, batchId, {
      status: "completed",
      completedAt: new Date(),
      metricsJson: metrics as object,
      driftSummaryJson: summary as object,
      tuningReviewRecommended: review.tuningReviewRecommended,
      tuningReviewReasonsJson: review.reasons,
      listingCount: fresh.items.length,
    });

    return {
      batchId,
      metrics,
      segments,
      driftSummary: summary,
      tuningReview: review,
      alerts,
    };
  } catch (e) {
    await updateCalibrationBatch(db, batchId, {
      status: "failed",
      completedAt: new Date(),
    });
    throw e;
  }
}
