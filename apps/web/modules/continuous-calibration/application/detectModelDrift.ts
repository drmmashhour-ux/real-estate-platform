import type { PrismaClient } from "@prisma/client";
import type { CalibrationBatchMetricsSnapshot } from "../domain/calibration.types";
import { buildDriftAlerts, summarizeDriftAlerts, type DriftAlertDraft } from "../infrastructure/driftDetectionService";
import { createDriftAlerts } from "../infrastructure/calibrationRepository";
import type { SegmentPerformanceRow } from "../domain/calibration.types";
import type { DriftThresholds } from "../domain/calibration.types";

export async function detectModelDriftAndPersist(
  db: PrismaClient,
  input: {
    batchId: string;
    currentMetrics: CalibrationBatchMetricsSnapshot;
    previousMetrics: CalibrationBatchMetricsSnapshot | null;
    segments: SegmentPerformanceRow[];
    thresholds?: DriftThresholds;
  },
): Promise<{ alerts: DriftAlertDraft[]; summary: ReturnType<typeof summarizeDriftAlerts> }> {
  const alerts = buildDriftAlerts(input.currentMetrics, input.previousMetrics, input.segments, input.thresholds);
  await createDriftAlerts(db, input.batchId, alerts);
  return { alerts, summary: summarizeDriftAlerts(alerts) };
}
