import { explainDeclarationSection } from "@/src/modules/seller-declaration-ai/infrastructure/declarationExplanationService";

export async function getSectionExplanation(sectionKey: string) {
  return explainDeclarationSection(sectionKey);
}
