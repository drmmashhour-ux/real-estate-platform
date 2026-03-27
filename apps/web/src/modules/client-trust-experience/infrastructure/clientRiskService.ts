import { RiskHighlightSeverity } from "@/src/modules/client-trust-experience/domain/clientExperience.enums";
import type { RiskHighlight } from "@/src/modules/client-trust-experience/domain/clientExperience.types";
import type { DeclarationValidationResult } from "@/src/modules/seller-declaration-ai/domain/declaration.types";

/**
 * Turns validation output into short, scannable risk rows. No legal advice—labels platform checks only.
 */
export function buildRiskHighlightsFromValidation(validation: DeclarationValidationResult): RiskHighlight[] {
  const out: RiskHighlight[] = [];

  validation.missingFields.forEach((m, i) => {
    out.push({
      id: `missing-${i}`,
      severity: RiskHighlightSeverity.Blocker,
      title: "Missing information",
      detail: `This field still needs an answer: ${m.replace(/_/g, " ")}.`,
    });
  });

  validation.contradictionFlags.forEach((c, i) => {
    out.push({
      id: `contra-${i}`,
      severity: RiskHighlightSeverity.Blocker,
      title: "Possible contradiction",
      detail: c,
    });
  });

  validation.knowledgeRuleBlocks.forEach((b, i) => {
    out.push({
      id: `rule-${i}`,
      severity: RiskHighlightSeverity.Blocker,
      title: "Needs attention before proceeding",
      detail: b,
    });
  });

  validation.warningFlags.forEach((w, i) => {
    out.push({
      id: `warn-${i}`,
      severity: RiskHighlightSeverity.Warning,
      title: "Review suggested",
      detail: w,
    });
  });

  validation.knowledgeRiskHints.slice(0, 3).forEach((h, i) => {
    out.push({
      id: `hint-${i}`,
      severity: RiskHighlightSeverity.Info,
      title: `Reference: ${h.sourceTitle}`,
      detail: h.content.slice(0, 280),
    });
  });

  return out;
}
