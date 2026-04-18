import type { ProposedAction } from "@/modules/ai-autopilot/ai-autopilot.types";
import { mapRetargetingRecommendations } from "@/modules/operator/recommendation-mappers.service";
import { ingestFromAssistantRecommendations } from "../platform-core.service";

export async function ingestRetargetingRecommendationsToCore(actions: ProposedAction[]) {
  const recs = mapRetargetingRecommendations(actions);
  return ingestFromAssistantRecommendations(recs);
}
