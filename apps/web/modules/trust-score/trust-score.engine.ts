import type { LecipmTrustOperationalBand } from "@prisma/client";

import { TRUST_WEIGHT_PROFILE_VERSION, getGroupWeight } from "./trust-score-weights.service";
import { buildOperationalTrustExplainability } from "./trust-score-explainability.service";
import { logTrustScore } from "./trust-score-log";
import type {
  OperationalTrustInputs,
  OperationalTrustResult,
  TrustFactorContribution,
} from "./trust-score.types";

const NEUTRAL_BASELINE = 50;
/** Deterministic scale: each normalized factor applies up to ~this many points before group multipliers. */
const INPUT_SCALE = 11;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function roundScore(n: number): number {
  return Math.round(n);
}

export function scoreToOperationalBand(score: number): LecipmTrustOperationalBand {
  if (score >= 85) return "HIGH_TRUST";
  if (score >= 70) return "GOOD";
  if (score >= 55) return "WATCH";
  if (score >= 40) return "ELEVATED_RISK";
  return "CRITICAL_REVIEW";
}

/**
 * Weighted deterministic trust score from normalized factor inputs (no hidden layers).
 */
export function computeOperationalTrust(inputs: OperationalTrustInputs): OperationalTrustResult {
  const contributions: TrustFactorContribution[] = [];
  let accumulator = NEUTRAL_BASELINE;

  for (const f of inputs.factors) {
    const gw = getGroupWeight(inputs.targetType, f.group);
    const rawDelta = f.normalized * INPUT_SCALE * gw;
    const contribution = clamp(rawDelta, -24, 24);
    contributions.push({
      factorId: f.id,
      group: f.group,
      weight: gw,
      contribution,
      label: f.rawNote,
    });
    accumulator += contribution;
  }

  const trustScore = clamp(roundScore(accumulator), 0, 100);
  const trustBand = scoreToOperationalBand(trustScore);

  const sortedByAbs = [...contributions].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const explain = buildOperationalTrustExplainability({
    trustScore,
    trustBand,
    contributions: sortedByAbs,
    warnings: inputs.warnings,
    thinDataNotes: inputs.thinDataNotes,
  });

  const result: OperationalTrustResult = {
    trustScore,
    trustBand,
    contributingFactors: sortedByAbs,
    warnings: inputs.warnings,
    explain,
    weightProfileVersion: TRUST_WEIGHT_PROFILE_VERSION,
  };

  logTrustScore("computed_operational_trust", {
    targetType: inputs.targetType,
    targetId: inputs.targetId,
    trustScore,
    trustBand,
    topFactorIds: sortedByAbs.slice(0, 5).map((c) => c.factorId),
  });

  return result;
}
