import { selectStrategyForProperty } from "@/src/modules/ai-selection-engine/infrastructure/strategySelectionService";
import { buildSelectionExplanation } from "@/src/modules/ai-selection-engine/infrastructure/selectionExplanationService";

export async function selectStrategy(propertyId: string, withExplanation = false) {
  const strategy = await selectStrategyForProperty(propertyId);
  if (!withExplanation) return strategy;
  return { ...strategy, explanation: buildSelectionExplanation(strategy) };
}
