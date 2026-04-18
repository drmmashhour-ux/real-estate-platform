import type { ProfitRecommendation } from "@/modules/growth/profit-engine.types";
import { mapProfitRecommendations } from "@/modules/operator/recommendation-mappers.service";
import { ingestFromAssistantRecommendations } from "../platform-core.service";

export async function ingestProfitRecommendationsToCore(rows: ProfitRecommendation[]) {
  const recs = mapProfitRecommendations(rows);
  return ingestFromAssistantRecommendations(recs);
}
