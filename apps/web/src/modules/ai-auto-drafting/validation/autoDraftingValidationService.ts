import { runDeclarationValidationDeterministic } from "@/src/modules/seller-declaration-ai/validation/declarationValidationService";
import { computeSectionCompleteness } from "@/src/modules/ai-auto-drafting/validation/autoDraftingCompletenessService";
import { detectAutoDraftContradictions } from "@/src/modules/ai-auto-drafting/validation/autoDraftingContradictionService";
export function validateAutoDraftFacts(templateId: string, sectionKey: string, facts: Record<string, unknown>) {
  const completeness = computeSectionCompleteness(templateId, sectionKey, facts);
  const contradictions =
    templateId === "seller_declaration_v1" ? detectAutoDraftContradictions(facts) : [];
  const declaration = templateId === "seller_declaration_v1" ? runDeclarationValidationDeterministic(facts) : null;
  return {
    completeness,
    contradictions,
    declarationValid: declaration?.isValid ?? null,
    knowledgeBlocks: declaration?.knowledgeRuleBlocks ?? [],
  };
}

export function isSellerDeclarationTemplate(templateId: string) {
  return templateId === "seller_declaration_v1" || templateId.startsWith("seller_declaration");
}
