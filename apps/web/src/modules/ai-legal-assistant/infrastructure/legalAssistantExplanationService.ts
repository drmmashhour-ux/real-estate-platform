import type { LegalAssistantContext } from "@/src/modules/ai-legal-assistant/domain/legalAssistant.types";

export function explainRiskFromContext(ctx: LegalAssistantContext) {
  const warnings = [...ctx.validation.warningFlags];
  const contradictions = [...ctx.validation.contradictionFlags];
  const summary = contradictions.length
    ? `Risk is elevated due to ${contradictions.length} contradiction flag(s).`
    : warnings.length
      ? `Risk is moderate with ${warnings.length} warning flag(s).`
      : "No major deterministic risk flags are currently detected.";

  return { summary, keyPoints: [...contradictions, ...warnings].slice(0, 6) };
}
