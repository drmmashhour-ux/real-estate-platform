import type { ProposedAction } from "@/modules/ai-autopilot/ai-autopilot.types";
import { mapAbDecisions } from "@/modules/operator/recommendation-mappers.service";
import { ingestFromAssistantRecommendations } from "../platform-core.service";

export async function ingestAbDecisionsToCore(actions: ProposedAction[]) {
  const recs = mapAbDecisions(actions);
  return ingestFromAssistantRecommendations(recs);
}
