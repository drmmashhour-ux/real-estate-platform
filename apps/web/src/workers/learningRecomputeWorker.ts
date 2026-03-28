import { logInfo } from "@/lib/logger";
import { recomputeTemplatePerformanceWindow } from "@/src/modules/messaging/learning/templatePerformance";

/**
 * Periodic rollup of template performance from decisions + outcome ledger (6–24h cron).
 */
export async function recomputeLearningRecommendations(): Promise<{
  rowsUpserted: number;
  windowDays: number;
  at: string;
}> {
  const windowDays = Math.max(7, Math.min(365, Number(process.env.AI_LEARNING_RECOMPUTE_DAYS ?? 90)));
  const { rowsUpserted } = await recomputeTemplatePerformanceWindow(windowDays);
  logInfo("Learning recompute completed", { rowsUpserted, windowDays });
  return { rowsUpserted, windowDays, at: new Date().toISOString() };
}
