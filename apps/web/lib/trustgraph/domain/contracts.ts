import type { FsboListingRuleContext } from "./types";
import type { RuleEvaluationResult } from "./types";

export type TrustGraphRule = {
  code: string;
  version: string;
  evaluate: (ctx: FsboListingRuleContext) => RuleEvaluationResult;
};

/**
 * Persisted rule rows (`verification_rule_results`) are the deterministic source of truth for
 * pass/fail, score deltas, and structured `details`. Raw `verification_signals` are internal
 * (evidence varies per rule); do not return them from public listing/buyer APIs.
 *
 * Optional AI copy should summarize `VerificationRuleResult` + case summary only — never invent facts
 * not grounded in rule output.
 */
export type VerificationRuleResultSnapshot = {
  ruleCode: string;
  ruleVersion: string;
  passed: boolean;
  scoreDelta: number;
  confidence: number | null;
  details: Record<string, unknown> | null;
};

/**
 * Strip raw signals for non-admin clients while preserving rule outcomes.
 */
export function toPublicVerificationCasePayload<T extends { signals: unknown[] }>(
  row: T
): Omit<T, "signals"> & { signalCount: number } {
  const { signals, ...rest } = row;
  return {
    ...rest,
    signalCount: Array.isArray(signals) ? signals.length : 0,
  };
}
