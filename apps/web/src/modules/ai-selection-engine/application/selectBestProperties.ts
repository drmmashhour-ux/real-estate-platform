import { rankPropertiesForUser } from "@/src/modules/ai-selection-engine/infrastructure/propertySelectionService";
import { buildSelectionExplanation } from "@/src/modules/ai-selection-engine/infrastructure/selectionExplanationService";

export async function selectBestProperties(userId: string, withExplanation = false) {
  const selections = await rankPropertiesForUser(userId);
  if (!withExplanation) return selections;
  return selections.map((s) => ({ ...s, explanation: buildSelectionExplanation(s) }));
}
