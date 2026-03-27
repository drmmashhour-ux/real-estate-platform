import type { RuleEvaluationResult, TrustGraphActionDraft, TrustGraphSignalDraft } from "@/lib/trustgraph/domain/types";

/**
 * Flattens signals from all rule results (order preserved).
 */
export function flattenSignalsFromRuleResults(results: RuleEvaluationResult[]): TrustGraphSignalDraft[] {
  return results.flatMap((r) => r.signals ?? []);
}

/**
 * Merges recommended actions across rules, deduping by `actionCode` (first wins).
 */
export function collectNextBestActionsFromRuleResults(results: RuleEvaluationResult[]): TrustGraphActionDraft[] {
  const byCode = new Map<string, TrustGraphActionDraft>();
  for (const r of results) {
    for (const a of r.recommendedActions ?? []) {
      if (!byCode.has(a.actionCode)) {
        byCode.set(a.actionCode, a);
      }
    }
  }
  return [...byCode.values()];
}
