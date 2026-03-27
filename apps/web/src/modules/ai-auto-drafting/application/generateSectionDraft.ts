import type { AutoDraftDocumentTypeId } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.enums";
import { buildSectionSuggestion } from "@/src/modules/ai-auto-drafting/infrastructure/autoDraftingSuggestionService";
import { validateAutoDraftFacts } from "@/src/modules/ai-auto-drafting/validation/autoDraftingValidationService";

export async function generateSectionDraft(args: {
  templateId: string;
  sectionKey: string;
  documentType: AutoDraftDocumentTypeId;
  facts: Record<string, unknown>;
}) {
  const validation = validateAutoDraftFacts(args.templateId, args.sectionKey, args.facts);
  const out = await buildSectionSuggestion(args);
  if (validation.contradictions.length) {
    out.assumptions.push(`Potential contradictions flagged: ${validation.contradictions.join("; ")}`);
    out.confidence = Math.max(0.1, out.confidence - 0.2);
  }
  return { ...out, validation };
}
