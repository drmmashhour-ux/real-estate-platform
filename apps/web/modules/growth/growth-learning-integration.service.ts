/**
 * Applies local learned weights to growth priority scores — gated by adaptive-weights flag.
 * Does not alter CRM, payments, or source-system fields.
 */

import { growthLearningFlags } from "@/config/feature-flags";
import type { GrowthExecutivePrioritySource } from "./growth-executive.types";
import type { GrowthFusionSource } from "./growth-fusion.types";
import type { AiAutopilotImpact } from "./ai-autopilot.types";
import { getGrowthCurrentWeights } from "./growth-learning-weights.service";

function clampScore(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function applyLearningToExecutivePriorityScore(
  score: number | undefined,
  source: GrowthExecutivePrioritySource,
): number | undefined {
  if (score == null || !growthLearningFlags.growthLearningAdaptiveWeightsV1) return score;
  const w = getGrowthCurrentWeights();
  let m = w.defaultBiasWeight;
  switch (source) {
    case "governance":
      m *= w.governancePenaltyWeight;
      break;
    case "ads":
      m *= 0.5 + w.confidenceWeight * 0.5;
      break;
    case "leads":
      m *= 0.55 + w.impactWeight * 0.45;
      break;
    case "fusion":
    case "cro":
      m *= 0.5 + w.signalStrengthWeight * 0.5;
      break;
    case "autopilot":
      m *= 0.45 + w.signalStrengthWeight * 0.55;
      break;
    case "content":
      m *= 0.5 + w.recencyWeight * 0.5;
      break;
    default:
      m *= w.defaultBiasWeight;
  }
  return clampScore(score * m);
}

export function applyLearningToFusionPriorityScore(base: number, source: GrowthFusionSource): number {
  if (!growthLearningFlags.growthLearningAdaptiveWeightsV1) return base;
  const w = getGrowthCurrentWeights();
  let m =
    w.defaultBiasWeight *
    (0.55 + w.signalStrengthWeight * 0.45) *
    (source === "ads" ? 0.5 + w.confidenceWeight * 0.5 : 1) *
    (source === "leads" ? 0.55 + w.impactWeight * 0.45 : 1) *
    (source === "cro" ? 0.5 + w.governancePenaltyWeight * 0.5 : 1);
  return clampScore(base * m);
}

export function applyLearningToAutopilotPriorityScore(base: number, impact: AiAutopilotImpact): number {
  if (!growthLearningFlags.growthLearningAdaptiveWeightsV1) return base;
  const w = getGrowthCurrentWeights();
  const impactTilt =
    impact === "high"
      ? w.impactWeight
      : impact === "medium"
        ? 0.88 + w.impactWeight * 0.12
        : 0.92 + w.impactWeight * 0.08;
  const m = w.defaultBiasWeight * (0.5 + w.confidenceWeight * 0.5) * (0.55 + w.signalStrengthWeight * 0.45) * impactTilt;
  return clampScore(base * m);
}
