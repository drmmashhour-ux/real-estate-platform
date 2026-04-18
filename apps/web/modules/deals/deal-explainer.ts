/**
 * User-facing copy — emphasizes broker primacy and official forms.
 */
export const DEAL_EXECUTION_DISCLAIMERS = {
  brokerPrimacy:
    "LECIPM amplifies the licensed broker. Official OACIQ forms and brokerage procedures remain authoritative.",
  noReplacement:
    "This assistant does not replace mandatory official forms. Use publisher-issued documents for execution.",
  draftAssistance:
    "All AI-assisted text is draft assistance only until you review and approve it.",
  noLegalAdvice:
    "Suggestions are operational prompts, not legal advice or guarantees of enforceability.",
} as const;

export function explainWorkflowHintDisclaimer(): string {
  return `${DEAL_EXECUTION_DISCLAIMERS.noReplacement} ${DEAL_EXECUTION_DISCLAIMERS.brokerPrimacy}`;
}
