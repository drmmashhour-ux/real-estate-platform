import { runDeclarationValidationDeterministic } from "@/src/modules/seller-declaration-ai/validation/declarationValidationService";
import { getDocumentContext } from "@/src/modules/ai-legal-assistant/tools/getDocumentContext";

export async function getValidationSummary(documentId: string, userId: string) {
  const doc = await getDocumentContext(documentId, userId);
  return runDeclarationValidationDeterministic((doc.draftPayload ?? {}) as Record<string, unknown>);
}
