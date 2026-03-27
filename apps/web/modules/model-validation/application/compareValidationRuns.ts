import type { PrismaClient } from "@prisma/client";
import { summarizeValidationImprovement } from "./summarizeValidationImprovement";
import { computeCalibrationMetrics } from "../infrastructure/calibrationMetricsService";
import { buildValidationMetricsDelta } from "../infrastructure/validationComparisonService";
import { getRunWithItems, upsertValidationRunComparison } from "../infrastructure/validationRepository";

export async function compareValidationRuns(db: PrismaClient, baseRunId: string, comparisonRunId: string) {
  const base = await getRunWithItems(db, baseRunId);
  const comp = await getRunWithItems(db, comparisonRunId);
  if (!base || !comp) throw new Error("Run not found");

  const mBase = computeCalibrationMetrics(base.items);
  const mComp = computeCalibrationMetrics(comp.items);
  const metricsDelta = buildValidationMetricsDelta(mBase, mComp);
  const summary = summarizeValidationImprovement(metricsDelta);

  await upsertValidationRunComparison(db, {
    baseRunId,
    comparisonRunId,
    metricsDelta,
    summary,
  });

  return { baseMetrics: mBase, comparisonMetrics: mComp, metricsDelta, summary };
}
