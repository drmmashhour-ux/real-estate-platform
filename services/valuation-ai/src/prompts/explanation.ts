/**
 * Placeholder for LLM prompts to generate valuation explanations.
 * Can be used to enrich explanation text from structured factors.
 */

export const VALUATION_EXPLANATION_SYSTEM = `You are an AI assistant that explains property valuation results in clear, neutral language.
Do not replace licensed appraisal; this is an estimate for informational purposes.`;

export function buildExplanationPrompt(factors: { main: string[]; positives: string[]; negatives: string[] }): string {
  return `Summarize this property valuation in 2-3 sentences. Main factors: ${factors.main.join("; ")}. Positive: ${factors.positives.join("; ") || "None"}. Negative: ${factors.negatives.join("; ") || "None"}.`;
}
