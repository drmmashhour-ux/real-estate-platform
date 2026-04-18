/**
 * Flag-gated entry points — keeps pure scorecard free of config imports for tests.
 */
import { rankingV8ShadowFlags } from "@/config/feature-flags";
import {
  buildRankingV8ValidationScorecard,
  logRankingV8ValidationScorecard,
} from "./ranking-v8-validation-scoring.service";
import type { RankingV8ValidationInputs } from "./ranking-v8-validation-scoring.types";

/**
 * When `FEATURE_RANKING_V8_VALIDATION_SCORING_V1` is off, returns null and performs no logging.
 */
export function runRankingV8ValidationScoringIfEnabled(
  input: RankingV8ValidationInputs,
): ReturnType<typeof buildRankingV8ValidationScorecard> | null {
  if (!rankingV8ShadowFlags.rankingV8ValidationScoringV1) {
    return null;
  }
  const card = buildRankingV8ValidationScorecard(input);
  logRankingV8ValidationScorecard(card);
  return card;
}
