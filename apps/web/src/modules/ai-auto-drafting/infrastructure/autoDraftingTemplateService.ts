import type { AutoDraftTemplateSchema } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.types";
import { autoDraftTemplates } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.schema";

export function getAutoDraftTemplateById(templateId: string): AutoDraftTemplateSchema | null {
  return autoDraftTemplates.find((t) => t.id === templateId) ?? null;
}

export function getSectionSchema(templateId: string, sectionKey: string) {
  const t = getAutoDraftTemplateById(templateId);
  if (!t) return null;
  return t.sections.find((s) => s.key === sectionKey) ?? null;
}
