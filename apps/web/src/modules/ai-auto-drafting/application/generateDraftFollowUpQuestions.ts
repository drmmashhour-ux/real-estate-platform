import { getSectionSchema } from "@/src/modules/ai-auto-drafting/infrastructure/autoDraftingTemplateService";
import type { StandardDraftOutput } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.types";
import type { AutoDraftDocumentTypeId } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.enums";
import { computeSectionCompleteness } from "@/src/modules/ai-auto-drafting/validation/autoDraftingCompletenessService";

export function generateDraftFollowUpQuestions(args: {
  templateId: string;
  sectionKey: string;
  documentType: AutoDraftDocumentTypeId;
  facts: Record<string, unknown>;
}): StandardDraftOutput {
  const { missing } = computeSectionCompleteness(args.templateId, args.sectionKey, args.facts);
  const section = getSectionSchema(args.templateId, args.sectionKey);
  const qs: string[] = missing.map((m) => `What is the current status of: ${m}?`);
  if (section) {
    for (const f of section.fields) {
      const v = args.facts[f.key];
      const empty = typeof v === "boolean" ? false : !String(v ?? "").trim();
      if (empty && f.required) qs.push(`Please confirm ${f.label} with dates or scope where applicable.`);
    }
  }
  return {
    documentType: args.documentType,
    sectionKey: args.sectionKey,
    suggestedText: "",
    assumptions: ["Questions are generated from missing template fields only."],
    missingFacts: missing,
    followUpQuestions: Array.from(new Set(qs)).slice(0, 12),
    confidence: 0.7,
    sourceRefs: [],
  };
}
