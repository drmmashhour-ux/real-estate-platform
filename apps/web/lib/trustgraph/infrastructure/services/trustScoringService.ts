import type { ReadinessLevel, TrustLevel } from "@prisma/client";
import {
  buildScoreBreakdown,
  readinessFromRules,
  trustLevelFromScore,
  aggregateScoreFromRules,
  type TrustGraphScoreBreakdown,
} from "@/lib/trustgraph/domain/scoring";
import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export type TrustScoringOutcome = {
  overallScore: number;
  trustLevel: TrustLevel;
  readinessLevel: ReadinessLevel;
  scoreBreakdown: TrustGraphScoreBreakdown;
};

/**
 * Deterministic scoring only — no AI, no DB.
 */
export const trustScoringService = {
  computeOutcome(results: RuleEvaluationResult[]): TrustScoringOutcome {
    const overallScore = aggregateScoreFromRules(results);
    return {
      overallScore,
      trustLevel: trustLevelFromScore(overallScore),
      readinessLevel: readinessFromRules(results),
      scoreBreakdown: buildScoreBreakdown(results),
    };
  },
};
