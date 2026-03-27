import type { PrismaClient } from "@prisma/client";
import type { CalibrationMetrics } from "../domain/validation.types";
import { computeCalibrationMetrics } from "../infrastructure/calibrationMetricsService";
import { getRunWithItems } from "../infrastructure/validationRepository";

export async function computeValidationMetrics(db: PrismaClient, runId: string): Promise<CalibrationMetrics | null> {
  const run = await getRunWithItems(db, runId);
  if (!run) return null;
  return computeCalibrationMetrics(run.items);
}
