import { mapCroRecommendations } from "@/modules/operator/recommendation-mappers.service";
import { ingestFromAssistantRecommendations } from "../platform-core.service";

export async function ingestCroRecommendationsToCore(input: Parameters<typeof mapCroRecommendations>[0]) {
  const recs = mapCroRecommendations(input);
  return ingestFromAssistantRecommendations(recs);
}
