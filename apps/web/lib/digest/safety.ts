/**
 * Guardrails for AI-generated digest copy — blocks absolute / guaranteed-return language
 * and autonomous execution framing (digest is advisory only).
 */
const GUARANTEED_OUTCOME_PATTERN =
  /\b(guaranteed|guarantee|risk-?free|no\s+risk|assured\s+(return|profit|yield)|100%\s*certain|certain\s+profit|can't\s+lose|cannot\s+lose)\b/i;

const AUTONOMOUS_EXECUTION =
  /\b(auto[- ]?execute|automatically\s+(?:sell|buy|purchase|list|close|refinance)|we\s+will\s+sell|we\s+will\s+buy|execute\s+(?:the\s+)?(?:sale|purchase))\b/i;

export function assertNoGuaranteedOutcomeInText(text: string, context: string): void {
  if (!text) return;
  if (GUARANTEED_OUTCOME_PATTERN.test(text)) {
    const err = new Error("GUARANTEED_OUTCOME_FORBIDDEN");
    (err as Error & { context?: string }).context = context;
    throw err;
  }
}

export function assertNoAutonomousExecutionInDigestText(text: string, context: string): void {
  if (!text) return;
  if (AUTONOMOUS_EXECUTION.test(text)) {
    const err = new Error("AUTONOMOUS_DIGEST_EXECUTION_FORBIDDEN");
    (err as Error & { context?: string }).context = context;
    throw err;
  }
}

export function assertNoGuaranteedOutcomeInDigest(payload: {
  summary: string | null | undefined;
  keyHighlights: string[];
  risks: string[];
  opportunities: string[];
  suggestedActions: string[];
}): void {
  assertNoGuaranteedOutcomeInText(payload.summary ?? "", "summary");
  assertNoAutonomousExecutionInDigestText(payload.summary ?? "", "summary");
  for (let i = 0; i < payload.keyHighlights.length; i++) {
    assertNoGuaranteedOutcomeInText(payload.keyHighlights[i] ?? "", `keyHighlights[${i}]`);
    assertNoAutonomousExecutionInDigestText(payload.keyHighlights[i] ?? "", `keyHighlights[${i}]`);
  }
  for (let i = 0; i < payload.risks.length; i++) {
    assertNoGuaranteedOutcomeInText(payload.risks[i] ?? "", `risks[${i}]`);
    assertNoAutonomousExecutionInDigestText(payload.risks[i] ?? "", `risks[${i}]`);
  }
  for (let i = 0; i < payload.opportunities.length; i++) {
    assertNoGuaranteedOutcomeInText(payload.opportunities[i] ?? "", `opportunities[${i}]`);
    assertNoAutonomousExecutionInDigestText(payload.opportunities[i] ?? "", `opportunities[${i}]`);
  }
  for (let i = 0; i < payload.suggestedActions.length; i++) {
    assertNoGuaranteedOutcomeInText(payload.suggestedActions[i] ?? "", `suggestedActions[${i}]`);
    assertNoAutonomousExecutionInDigestText(payload.suggestedActions[i] ?? "", `suggestedActions[${i}]`);
  }
}
