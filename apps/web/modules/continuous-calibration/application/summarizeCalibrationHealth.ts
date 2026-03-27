import type { PrismaClient } from "@prisma/client";
import type { CalibrationBatchMetricsSnapshot, CalibrationHealthSummary } from "../domain/calibration.types";
import { getActiveTuningProfile, listCalibrationBatches } from "../infrastructure/calibrationRepository";

function parseMetrics(json: unknown): CalibrationBatchMetricsSnapshot | null {
  if (!json || typeof json !== "object") return null;
  return json as CalibrationBatchMetricsSnapshot;
}

export async function summarizeCalibrationHealth(db: PrismaClient): Promise<CalibrationHealthSummary> {
  const active = await getActiveTuningProfile(db);
  const batches = await listCalibrationBatches(db, 20);
  const lastFive = batches.slice(0, 5);

  const latest = batches[0] ?? null;

  return {
    activeProductionProfile: active
      ? {
          id: active.id,
          name: active.name,
          isActive: active.isActive,
          createdAt: active.createdAt.toISOString(),
        }
      : null,
    latestBatch: latest
      ? {
          id: latest.id,
          name: latest.name,
          status: latest.status,
          listingCount: latest.listingCount,
          createdAt: latest.createdAt.toISOString(),
          completedAt: latest.completedAt?.toISOString() ?? null,
          metrics: parseMetrics(latest.metricsJson),
        }
      : null,
    lastFiveBatches: lastFive.map((b) => ({
      id: b.id,
      name: b.name,
      status: b.status,
      listingCount: b.listingCount,
      createdAt: b.createdAt.toISOString(),
      completedAt: b.completedAt?.toISOString() ?? null,
      metrics: parseMetrics(b.metricsJson),
      tuningReviewRecommended: b.tuningReviewRecommended ?? null,
    })),
    trends: {
      trustAgreement: lastFive.map((b) => parseMetrics(b.metricsJson)?.trustAgreementRate ?? null).reverse(),
      dealAgreement: lastFive.map((b) => parseMetrics(b.metricsJson)?.dealAgreementRate ?? null).reverse(),
      fpHighTrust: lastFive.map((b) => parseMetrics(b.metricsJson)?.falsePositiveHighTrustRate ?? null).reverse(),
      fpStrongOpportunity: lastFive
        .map((b) => parseMetrics(b.metricsJson)?.falsePositiveStrongOpportunityRate ?? null)
        .reverse(),
      lowConfDisagreementConcentration: lastFive
        .map((b) => parseMetrics(b.metricsJson)?.lowConfidenceDisagreementConcentration ?? null)
        .reverse(),
    },
  };
}
