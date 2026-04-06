import { deriveAiUiLabels } from "./computeListingScore";
import { getUnifiedRecommendations } from "@/lib/ai/recommendations/getUnifiedRecommendations";

/**
 * Personalized BNHub stays — thin wrapper around unified recommendations + UI labels.
 */
export async function getPersonalizedRecommendations(userId: string, limit = 12) {
  const rows = await getUnifiedRecommendations(userId, limit);
  const n = rows.length;
  return rows.map((r, rankIndex) => ({
    ...r,
    aiLabels: deriveAiUiLabels(r.aiBreakdown, rankIndex, n),
  }));
}
