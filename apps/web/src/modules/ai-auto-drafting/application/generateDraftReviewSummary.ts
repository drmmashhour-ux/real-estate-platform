import type { AutoDraftDocumentTypeId } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.enums";
import type { StandardDraftOutput } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.types";
import { runDeclarationValidationDeterministic } from "@/src/modules/seller-declaration-ai/validation/declarationValidationService";

export function generateDraftReviewSummary(args: {
  documentType: AutoDraftDocumentTypeId;
  sectionKey: string;
  facts: Record<string, unknown>;
}): StandardDraftOutput {
  const v = runDeclarationValidationDeterministic(args.facts);
  const lines = [
    `Completeness: ${v.completenessPercent}%`,
    v.missingFields.length ? `Missing fields: ${v.missingFields.join(", ")}` : "Required field coverage: OK (per deterministic rules).",
    v.contradictionFlags.length ? `Contradictions: ${v.contradictionFlags.join(" | ")}` : "No contradictions flagged.",
    v.knowledgeRuleBlocks?.length ? `Blocking rules: ${v.knowledgeRuleBlocks.join(" | ")}` : null,
    v.warningFlags.length ? `Warnings: ${v.warningFlags.join(" | ")}` : null,
  ].filter(Boolean);

  return {
    documentType: args.documentType,
    sectionKey: args.sectionKey,
    suggestedText: lines.join("\n"),
    assumptions: ["Summary derived from deterministic validation only."],
    missingFacts: v.missingFields,
    followUpQuestions: v.missingFields.map((m) => `Clarify or complete: ${m}`),
    confidence: v.isValid ? 0.85 : 0.45,
    sourceRefs: [],
  };
}
