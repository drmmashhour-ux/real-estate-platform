import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import type { VerificationCase, VerificationSignal } from "@prisma/client";

export type CaseSummaryOutput = {
  explanation: string;
  riskSummary: string;
  missingItems: string[];
  scoreRationale: string;
  recommendedNextSteps: string[];
};

/**
 * Deterministic summary (AI can wrap this later). No fabricated facts.
 */
export function buildDeterministicCaseSummary(args: {
  caseRow: Pick<VerificationCase, "overallScore" | "trustLevel" | "readinessLevel" | "entityType" | "entityId">;
  ruleResults: RuleEvaluationResult[];
  signals: Pick<VerificationSignal, "signalCode" | "message" | "severity" | "category">[];
}): CaseSummaryOutput {
  const failedRules = args.ruleResults.filter((r) => !r.passed).map((r) => r.ruleCode);
  const openSignals = args.signals.filter(Boolean);
  const missingItems = openSignals
    .map((s) => s.message)
    .filter((m): m is string => typeof m === "string" && m.length > 0)
    .slice(0, 12);

  const scoreRationale = `Overall score ${args.caseRow.overallScore}/100 is computed from a rules-first engine (base 50, then rule deltas), clamped 0–100. Trust level: ${args.caseRow.trustLevel}. Readiness: ${args.caseRow.readinessLevel}.`;

  const riskSummary =
    failedRules.length > 0
      ? `Attention: ${failedRules.length} rule(s) did not pass (${failedRules.join(", ")}).`
      : "No blocking rule failures recorded in the last run.";

  const explanation = [
    `Entity ${args.caseRow.entityType} / ${args.caseRow.entityId}.`,
    scoreRationale,
    riskSummary,
  ].join(" ");

  const recommendedNextSteps = args.ruleResults
    .flatMap((r) => r.recommendedActions ?? [])
    .map((a) => a.title)
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .slice(0, 8);

  return {
    explanation,
    riskSummary,
    missingItems,
    scoreRationale,
    recommendedNextSteps,
  };
}
