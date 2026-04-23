/**
 * Proactive suggestions: human approval for workflows; no guaranteed outcomes; no autonomous execution copy.
 */

const GUARANTEED =
  /\b(guaranteed|guarantee|risk-?free|no\s+risk|assured\s+return|certain\s+profit|will\s+definitely)\b/i;

const AUTO_EXEC =
  /\b(auto[- ]?execute|automatically\s+(?:buy|sell|sign|wire|transfer)|we\s+(?:will|\'ll)\s+(?:buy|sell|sign)\s+for\s+you)\b/i;

const REGULATED_AUTO =
  /\b(wire\s+funds|notarize\s+automatically|file\s+(?:your\s+)?tax(?:es)?\s+for\s+you|bind\s+coverage\s+without\s+approval)\b/i;

export class ProactiveSuggestionError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "ProactiveSuggestionError";
  }
}

export function assertProactiveSuggestionTextSafe(text: string): void {
  if (!text) return;
  if (GUARANTEED.test(text)) {
    throw new ProactiveSuggestionError("GUARANTEED_OUTCOME_FORBIDDEN");
  }
  if (AUTO_EXEC.test(text) || REGULATED_AUTO.test(text)) {
    throw new ProactiveSuggestionError("PROACTIVE_WORKFLOW_REQUIRES_APPROVAL");
  }
}

export type ProactiveAiSuggestion = {
  suggestionType: string;
  priority: string;
  title: string;
  message: string;
  workflowType?: string | null;
  workflowPayload?: unknown;
  rationale?: unknown;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
};

export function assertProactiveAiSuggestionsSafe(items: ProactiveAiSuggestion[]): void {
  for (let i = 0; i < items.length; i++) {
    const s = items[i];
    assertProactiveSuggestionTextSafe(s.title);
    assertProactiveSuggestionTextSafe(s.message);
    if (s.workflowType) {
      assertProactiveSuggestionTextSafe(s.workflowType);
    }
    const payloadStr = JSON.stringify(s.workflowPayload ?? {});
    assertProactiveSuggestionTextSafe(payloadStr);
    if (/\"autoExecute\"\s*:\s*true/.test(payloadStr)) {
      throw new ProactiveSuggestionError("PROACTIVE_WORKFLOW_REQUIRES_APPROVAL");
    }
  }
}
