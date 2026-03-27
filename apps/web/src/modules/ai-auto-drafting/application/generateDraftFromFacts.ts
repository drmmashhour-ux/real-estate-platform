import type { AutoDraftDocumentTypeId } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.enums";
import { generateSectionDraft } from "@/src/modules/ai-auto-drafting/application/generateSectionDraft";

export async function generateDraftFromFacts(args: {
  templateId: string;
  sectionKey: string;
  documentType: AutoDraftDocumentTypeId;
  facts: Record<string, unknown>;
}) {
  return generateSectionDraft(args);
}
