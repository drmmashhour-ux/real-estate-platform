/**
 * Portfolio autopilot is advisory-only — no autonomous execution of trades, listings, or financing.
 */

const GUARANTEED_PERFORMANCE =
  /\b(guaranteed|guarantee|promise(?:d)?\s+(?:return|profit|yield)|assured\s+return|no\s+risk\s+return|certain\s+profit|will\s+(?:definitely\s+)?(?:double|triple))\b/i;

const AUTONOMOUS_EXECUTION =
  /\b(auto[- ]?execute|automatically\s+(?:sell|buy|purchase|list|close|refinance)|place\s+(?:the\s+)?order\s+for\s+you|we\s+will\s+sell|we\s+will\s+buy|execute\s+(?:the\s+)?(?:sale|purchase)|submit\s+(?:the\s+)?offer\s+without\s+your)\b/i;

export function assertNoGuaranteedPerformanceLanguage(text: string, context: string): void {
  if (!text) return;
  if (GUARANTEED_PERFORMANCE.test(text)) {
    const err = new Error("GUARANTEED_PERFORMANCE_LANGUAGE_FORBIDDEN");
    (err as Error & { context?: string }).context = context;
    throw err;
  }
}

export function assertNoAutonomousExecutionLanguage(text: string, context: string): void {
  if (!text) return;
  if (AUTONOMOUS_EXECUTION.test(text)) {
    const err = new Error("AUTONOMOUS_TRANSACTION_FORBIDDEN");
    (err as Error & { context?: string }).context = context;
    throw err;
  }
}

export function assertAdvisoryPortfolioAiPayload(payload: {
  summary?: string | null;
  recommendations?: Array<{ title?: string; aiSummary?: string | null }>;
}): void {
  assertNoGuaranteedPerformanceLanguage(payload.summary ?? "", "summary");
  assertNoAutonomousExecutionLanguage(payload.summary ?? "", "summary");
  const recs = payload.recommendations ?? [];
  for (let i = 0; i < recs.length; i++) {
    assertNoGuaranteedPerformanceLanguage(recs[i]?.title ?? "", `recommendations[${i}].title`);
    assertNoAutonomousExecutionLanguage(recs[i]?.title ?? "", `recommendations[${i}].title`);
    assertNoGuaranteedPerformanceLanguage(recs[i]?.aiSummary ?? "", `recommendations[${i}].aiSummary`);
    assertNoAutonomousExecutionLanguage(recs[i]?.aiSummary ?? "", `recommendations[${i}].aiSummary`);
  }
}
