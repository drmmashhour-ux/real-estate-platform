import type { BrainLearningSource } from "./brain-v2.types";
import type { BrainDecisionInput, BrainDecisionOutput } from "./one-brain.contract";
import {
  computeBaseTrustScore,
  computeTrustScore,
  computeExecutionPriority,
  isExecutionAllowed,
} from "./trust-engine.service";

function mapBrainSourceForWeight(source: BrainDecisionInput["source"]): BrainLearningSource | undefined {
  if (source === "OPERATOR") return "UNIFIED";
  if (
    source === "ADS" ||
    source === "CRO" ||
    source === "RETARGETING" ||
    source === "AB_TEST" ||
    source === "PROFIT" ||
    source === "MARKETPLACE" ||
    source === "UNIFIED"
  ) {
    return source;
  }
  return undefined;
}

export function processBrainDecision(input: BrainDecisionInput): BrainDecisionOutput {
  const w = input.sourceWeight ?? 1.0;
  const brainSource = mapBrainSourceForWeight(input.source);

  if (input.blockers && input.blockers.length > 0) {
    const baseTrustScore = computeBaseTrustScore(input);
    const trustScore = computeTrustScore({ ...input, sourceWeight: w });
    return {
      trustScore,
      baseTrustScore,
      sourceWeightApplied: w,
      executionPriority: 1,
      rankingImpact: 0,
      executionAllowed: false,
      reasoning: "Execution blocked: decision has active blockers (One Brain safety).",
      adaptationReason:
        w === 1 ?
          "Adaptive weight not applied to execution policy while blockers are present."
        : `Source weight ${w.toFixed(2)} (${brainSource ?? "mapped"}) recorded for audit; blockers still prevent execution.`,
    };
  }

  const baseTrustScore = computeBaseTrustScore(input);
  const trustScore = computeTrustScore({ ...input, sourceWeight: w });
  const executionPriority = computeExecutionPriority(trustScore);
  const executionAllowed = isExecutionAllowed(trustScore);
  const rankingImpact = trustScore * executionPriority;

  const adaptationReason =
    w === 1 ?
      "No adaptive source weight applied (multiplier 1.0)."
    : `Adaptive trust: base ${baseTrustScore.toFixed(2)} × source weight ${w.toFixed(2)} (${brainSource ?? "source"}) → ${trustScore.toFixed(2)} (capped at 1.0).`;

  return {
    trustScore,
    baseTrustScore,
    sourceWeightApplied: w,
    executionPriority,
    rankingImpact,
    executionAllowed,
    reasoning: `Trust ${trustScore.toFixed(2)} from confidence/evidence${w !== 1 ? ` with adaptive weight ${w.toFixed(2)}` : ""}`,
    adaptationReason,
  };
}
