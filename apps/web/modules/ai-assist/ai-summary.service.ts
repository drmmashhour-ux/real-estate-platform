import { buildAdminDailyAiSummary } from "./admin-daily-summary.service";
import type { AiAssistResult } from "./ai-assist.types";
import type { AiRecommendationItem } from "./ai-assist.types";

/**
 * Curated “AI summary” entry point (v1: admin daily only; expand per hub).
 * **No-throw** at call site — use `ok` flag.
 */
export async function getAiSummaryForContext(
  context: "admin_daily"
): Promise<AiAssistResult<{ items: AiRecommendationItem[] }>> {
  if (context === "admin_daily") {
    return buildAdminDailyAiSummary();
  }
  return { ok: false, error: "Unknown summary context", code: "AI_SUMMARY" };
}
