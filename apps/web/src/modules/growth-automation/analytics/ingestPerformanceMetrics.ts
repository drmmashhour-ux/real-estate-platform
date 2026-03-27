import type { PerformanceRow } from "@/src/modules/growth-automation/domain/growth-automation.types";
import { upsertPerformanceMetric } from "@/src/modules/growth-automation/infrastructure/growthAutomationRepository";

export async function ingestPerformanceMetrics(row: PerformanceRow) {
  return upsertPerformanceMetric(row);
}
