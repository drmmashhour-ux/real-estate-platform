import type { ScalingRecommendation } from "@/modules/ads/ads-scaling-recommendations.service";
import { mapAdsRecommendations } from "@/modules/operator/recommendation-mappers.service";
import { ingestFromAssistantRecommendations } from "../platform-core.service";

export async function ingestAdsRecommendationsToCore(rows: ScalingRecommendation[]) {
  const recs = mapAdsRecommendations(rows);
  return ingestFromAssistantRecommendations(recs);
}
