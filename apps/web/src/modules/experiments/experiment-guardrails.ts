/**
 * Kill-switch + coarse guardrails — extend with real complaint/spam rates when wired.
 * TODO v3: auto-winner selection with statistical tests.
 */
export function evaluateExperimentGuardrails(metrics: Record<string, number>): string[] {
  const warnings: string[] = [];
  const spam = metrics["spam_complaint"] ?? 0;
  const opens = metrics["campaign_open"] ?? 0;
  if (opens > 0 && spam / opens > 0.05) {
    warnings.push("spam_rate_high");
  }
  return warnings;
}
