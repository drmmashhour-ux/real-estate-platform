import type { AssistantRecommendation } from "@/modules/operator/operator.types";
import { ingestFromAssistantRecommendations } from "../platform-core.service";

export async function ingestOperatorRecommendationsToCore(recs: AssistantRecommendation[]) {
  return ingestFromAssistantRecommendations(recs);
}
