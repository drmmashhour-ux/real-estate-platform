import { LegalAssistantIntent } from "@/src/modules/ai-legal-assistant/domain/legalAssistant.enums";
import type { LegalAssistantContext, LegalAssistantResponse } from "@/src/modules/ai-legal-assistant/domain/legalAssistant.types";
import { explainRiskFromContext } from "@/src/modules/ai-legal-assistant/infrastructure/legalAssistantExplanationService";
import { suggestNextActions } from "@/src/modules/ai-legal-assistant/infrastructure/legalAssistantSuggestionService";

export function buildLegalAssistantResponse(intent: LegalAssistantIntent, ctx: LegalAssistantContext, extras?: Partial<LegalAssistantResponse>): LegalAssistantResponse {
  const risk = explainRiskFromContext(ctx);
  const base: LegalAssistantResponse = {
    intent,
    summary: "Grounded assistant response from current document context.",
    keyPoints: [],
    warnings: [...ctx.validation.warningFlags, ...ctx.validation.contradictionFlags].slice(0, 8),
    recommendedActions: suggestNextActions(ctx),
    confidence: 82,
    sourceSections: ctx.validation.sectionStatuses.map((s) => s.sectionKey).slice(0, 8),
  };

  if (intent === LegalAssistantIntent.IDENTIFY_MISSING_ITEMS) {
    base.summary = `${ctx.validation.missingFields.length} required field(s) are currently missing.`;
    base.keyPoints = ctx.validation.missingFields.slice(0, 12);
  } else if (intent === LegalAssistantIntent.EXPLAIN_RISK) {
    base.summary = risk.summary;
    base.keyPoints = risk.keyPoints;
  } else if (intent === LegalAssistantIntent.EXPLAIN_STATUS) {
    base.summary = `Document status is ${ctx.status.replace(/_/g, " ")}.`;
    base.keyPoints = [
      `Completeness: ${ctx.validation.completenessPercent}%`,
      `Contradictions: ${ctx.validation.contradictionFlags.length}`,
      `Warnings: ${ctx.validation.warningFlags.length}`,
    ];
  } else if (intent === LegalAssistantIntent.PREPARE_FOR_SIGNATURE) {
    const pending = ctx.signatures.filter((s) => s.status !== "signed").length;
    base.summary = pending ? `${pending} signature item(s) are not signed yet.` : "All tracked signatures are in signed state.";
    base.keyPoints = ctx.signatures.map((s) => `${s.signerName}: ${s.status}`);
    base.recommendedActions = pending ? ["Verify signer identity and pending signature state.", "Ensure document is finalized/exported before requesting final sign-off."] : ["Archive signed document and notify stakeholders."];
  } else if (intent === LegalAssistantIntent.SUMMARIZE_DOCUMENT) {
    base.summary = `Document is ${ctx.validation.completenessPercent}% complete with status ${ctx.status}.`;
    base.keyPoints = [
      `${Object.keys(ctx.payload).length} populated fields`,
      `${ctx.validation.missingFields.length} required missing fields`,
      `${ctx.validation.contradictionFlags.length} contradiction flags`,
    ];
  }

  return { ...base, ...(extras ?? {}) };
}
