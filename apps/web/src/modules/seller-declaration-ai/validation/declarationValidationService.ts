import { sellerDeclarationSections } from "@/src/modules/seller-declaration-ai/domain/declaration.schema";
import type { DeclarationValidationResult } from "@/src/modules/seller-declaration-ai/domain/declaration.types";
import { computeDeclarationCompleteness } from "@/src/modules/seller-declaration-ai/validation/declarationCompletenessService";
import { detectDeclarationContradictions } from "@/src/modules/seller-declaration-ai/validation/declarationContradictionService";
import { evaluateDeclarationKnowledgeRules } from "@/src/modules/knowledge/rules/knowledgeRuleEngine";

export function runDeclarationValidationDeterministic(payload: Record<string, unknown>): DeclarationValidationResult {
  const { completenessPercent, missingFields } = computeDeclarationCompleteness(payload);
  const contradictionFlags = detectDeclarationContradictions(payload);
  const warningFlags: string[] = [];

  if ((payload.renovations_flag === true || payload.renovations_flag === "true") && !String(payload.renovations_details ?? "").toLowerCase().includes("20")) {
    warningFlags.push("Repair/renovation mentioned without clear date.");
  }

  const rules = evaluateDeclarationKnowledgeRules(payload);

  const sectionStatuses = sellerDeclarationSections.map((section) => {
    const sectionMissing = section.fields
      .filter((f) => !f.conditional || payload[f.conditional.fieldKey] === f.conditional.equals)
      .filter((f) => f.required)
      .filter((f) => {
        const v = payload[f.key];
        return typeof v === "boolean" ? false : !String(v ?? "").trim();
      })
      .map((f) => f.key);
    return { sectionKey: section.key, ready: sectionMissing.length === 0, missing: sectionMissing };
  });

  const ruleWarnings = Array.from(new Set([...warningFlags, ...rules.warnings]));
  const blockedByRules = rules.blocks.length > 0;

  return {
    isValid: missingFields.length === 0 && contradictionFlags.length === 0 && !blockedByRules,
    completenessPercent,
    missingFields,
    contradictionFlags,
    warningFlags: ruleWarnings,
    sectionStatuses,
    knowledgeRuleBlocks: rules.blocks,
    knowledgeRuleWarnings: rules.warnings,
    knowledgeRiskHints: [],
  };
}
