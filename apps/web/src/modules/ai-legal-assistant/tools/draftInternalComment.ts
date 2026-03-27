import { getValidationSummary } from "@/src/modules/ai-legal-assistant/tools/getValidationSummary";

export async function draftInternalComment(documentId: string, userId: string, sectionKey?: string) {
  const validation = await getValidationSummary(documentId, userId);
  const focus = sectionKey ? `Section ${sectionKey}` : "Document";
  const text = `${focus}: ${validation.missingFields.length} missing fields, ${validation.contradictionFlags.length} contradictions, ${validation.warningFlags.length} warnings. Request targeted updates before approval.`;
  return { text, sectionKey: sectionKey ?? null };
}
