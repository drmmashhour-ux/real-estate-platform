import {
  ReadinessLevel,
  TrustLevel,
} from "@prisma/client";
import type { RuleEvaluationResult } from "./types";

const BASE_SCORE = 50;

/** Stored on `verification_cases.score_breakdown` (jsonb). */
export type TrustGraphScoreBreakdown = {
  version: "1";
  baseScore: number;
  rules: Array<{
    ruleCode: string;
    ruleVersion: string;
    passed: boolean;
    scoreDelta: number;
  }>;
  aggregateScore: number;
};

export function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function aggregateScoreFromRules(results: RuleEvaluationResult[]): number {
  let s = BASE_SCORE;
  for (const r of results) {
    s += r.scoreDelta;
  }
  return clampScore(s);
}

/** Deterministic audit payload stored on `verification_cases.score_breakdown`. */
export function buildScoreBreakdown(results: RuleEvaluationResult[]): TrustGraphScoreBreakdown {
  return {
    version: "1",
    baseScore: BASE_SCORE,
    rules: results.map((r) => ({
      ruleCode: r.ruleCode,
      ruleVersion: r.ruleVersion,
      passed: r.passed,
      scoreDelta: r.scoreDelta,
    })),
    aggregateScore: aggregateScoreFromRules(results),
  };
}

export function trustLevelFromScore(score: number): TrustLevel {
  if (score >= 85) return "verified";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

export function readinessFromRules(results: RuleEvaluationResult[]): ReadinessLevel {
  const hasCritical = results.some((r) =>
    (r.signals ?? []).some((s) => s.severity === "critical")
  );
  if (hasCritical) return "action_required";

  const anyFailImportant = results.some(
    (r) => !r.passed && (r.signals ?? []).some((s) => s.severity === "high" || s.severity === "medium")
  );
  if (anyFailImportant) return "partial";

  const allPass = results.length > 0 && results.every((r) => r.passed);
  if (allPass) return "ready";

  return "not_ready";
}

export { BASE_SCORE };
