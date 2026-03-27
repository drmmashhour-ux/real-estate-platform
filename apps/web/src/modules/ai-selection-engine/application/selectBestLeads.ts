import { rankLeadsForUser } from "@/src/modules/ai-selection-engine/infrastructure/leadSelectionService";
import { buildSelectionExplanation } from "@/src/modules/ai-selection-engine/infrastructure/selectionExplanationService";

export async function selectBestLeads(userId: string, withExplanation = false) {
  const leads = await rankLeadsForUser(userId);
  if (!withExplanation) return leads;
  return leads.map((lead) => ({ ...lead, explanation: buildSelectionExplanation(lead) }));
}
