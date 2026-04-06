import { getSellerDeclarationSections } from "@/src/modules/seller-declaration-ai/domain/declaration.schema";
import type { DeclarationValidationResult } from "@/src/modules/seller-declaration-ai/domain/declaration.types";
import { evaluateSellerWorkflowPillarRules } from "@/src/modules/seller-declaration-ai/knowledge/sellerWorkflowPillarRules";
import { evaluateDeclarationContentCompliance } from "@/src/modules/seller-declaration-ai/validation/declarationContentComplianceService";
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
  const pillar = evaluateSellerWorkflowPillarRules(payload);
  const contentIssues = evaluateDeclarationContentCompliance(payload);

  const sectionStatuses = getSellerDeclarationSections(payload).map((section) => {
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
  const blockedByRules = rules.blocks.length > 0 || contentIssues.some((issue) => issue.severity === "block");

  return {
    isValid: missingFields.length === 0 && contradictionFlags.length === 0 && !blockedByRules,
    completenessPercent,
    missingFields,
    contradictionFlags,
    warningFlags: ruleWarnings,
    declarationVariant: pillar.declarationVariant,
    representationMode: pillar.representationMode,
    sectionStatuses,
    knowledgeRuleBlocks: [...rules.blocks, ...contentIssues.filter((issue) => issue.severity === "block").map((issue) => issue.message)],
    knowledgeRuleWarnings: rules.warnings,
    knowledgeRiskHints: [],
    contentIssues,
  };
}
