import { mapMarketplaceDecisions } from "@/modules/operator/recommendation-mappers.service";
import { ingestFromAssistantRecommendations } from "../platform-core.service";

export async function ingestMarketplaceRecommendationsToCore(
  rows: Parameters<typeof mapMarketplaceDecisions>[0],
) {
  const recs = mapMarketplaceDecisions(rows);
  return ingestFromAssistantRecommendations(recs);
}
