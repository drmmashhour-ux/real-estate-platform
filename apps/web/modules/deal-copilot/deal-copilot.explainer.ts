import { DEAL_EXECUTION_DISCLAIMERS } from "../deals/deal-explainer";

export function copilotHeaderDisclaimer(): string {
  return `${DEAL_EXECUTION_DISCLAIMERS.draftAssistance} ${DEAL_EXECUTION_DISCLAIMERS.noLegalAdvice}`;
}
