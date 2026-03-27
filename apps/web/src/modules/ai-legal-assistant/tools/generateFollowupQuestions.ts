import { generateFollowUpQuestionsSafe } from "@/src/modules/seller-declaration-ai/infrastructure/declarationAISuggestionService";
import { getDocumentContext } from "@/src/modules/ai-legal-assistant/tools/getDocumentContext";

export async function generateFollowupQuestions(documentId: string, userId: string, sectionKey: string) {
  const doc = await getDocumentContext(documentId, userId);
  const payload = (doc.draftPayload ?? {}) as Record<string, unknown>;
  return generateFollowUpQuestionsSafe({ sectionKey, currentAnswer: String(payload[`${sectionKey}_details`] ?? ""), currentDraft: payload });
}
