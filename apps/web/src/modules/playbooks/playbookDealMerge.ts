import type { DealAssistantAnalysis } from "@/src/modules/deal-assistant/dealAssistantEngine";

/**
 * Prefer the playbook line as the structured spine; enrich with Deal Assistant heuristics when confident and non-redundant.
 */
export function mergePlaybookWithDealAssistant(
  playbookMessage: string,
  ai: Pick<DealAssistantAnalysis, "messageSuggestion" | "confidence">
): string {
  const base = playbookMessage.trim();
  const sug = ai.messageSuggestion.trim();
  if (!sug || ai.confidence < 0.62) return base;
  const prefix = sug.slice(0, 32).toLowerCase();
  if (prefix.length > 8 && base.toLowerCase().includes(prefix)) return base;
  return `${base} ${sug}`;
}
