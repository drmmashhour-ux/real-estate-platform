import { oneBrainV2Flags } from "@/config/feature-flags";
import { computeTrustScore } from "@/modules/platform-core/trust-engine.service";
import type { BrainLearningSource } from "@/modules/platform-core/brain-v2.types";
import { getCurrentSourceWeights } from "@/modules/platform-core/brain-v2.repository";
import type { AssistantRecommendation } from "./operator.types";
import {
  profitImpactFromMetrics,
  scoreRecommendation,
  urgencyFromMetrics,
} from "./operator-priority.service";
import { applyConflictGroups, assignConflictGroups } from "./operator-conflict-engine.service";
import type { OperatorScoredRecommendation } from "./operator-v2.types";

function toBrainSource(source: AssistantRecommendation["source"]): BrainLearningSource {
  switch (source) {
    case "ADS":
      return "ADS";
    case "CRO":
      return "CRO";
    case "RETARGETING":
      return "RETARGETING";
    case "AB_TEST":
      return "AB_TEST";
    case "PROFIT":
      return "PROFIT";
    case "PORTFOLIO":
      return "PROFIT";
    case "MARKETPLACE":
      return "MARKETPLACE";
    case "UNIFIED":
    default:
      return "UNIFIED";
  }
}

/**
 * Trust + optional Brain V2 adaptive source weight; does not bypass guardrails.
 */
export async function scoreAssistantRecommendations(
  recs: AssistantRecommendation[],
): Promise<OperatorScoredRecommendation[]> {
  const useAdaptive = oneBrainV2Flags.oneBrainV2AdaptiveV1 || oneBrainV2Flags.oneBrainV2RankingWeightingV1;
  const weights = useAdaptive ? await getCurrentSourceWeights() : null;

  const groups = assignConflictGroups(recs);

  const scored: OperatorScoredRecommendation[] = [];
  for (const r of recs) {
    const brainSrc = toBrainSource(r.source);
    const w =
      weights ? weights.find((x) => x.source === brainSrc)?.weight ?? 1 : 1;
    const trustScore = computeTrustScore({
      confidenceScore: r.confidenceScore,
      evidenceScore: r.evidenceScore ?? undefined,
      learningSignals: r.reason ? [r.reason.slice(0, 120)] : undefined,
      source: brainSrc,
      sourceWeight: useAdaptive ? w : 1,
    });
    const profitImpact = profitImpactFromMetrics(r.metrics);
    const urgencyScore = urgencyFromMetrics(r.metrics);
    const priorityScore = scoreRecommendation({
      trustScore,
      confidenceScore: r.confidenceScore,
      profitImpact: profitImpact ?? undefined,
      urgencyScore: urgencyScore ?? undefined,
      actionType: r.actionType,
    });
    const reasons: string[] = [
      whyTrust(trustScore, w, useAdaptive),
      `Model confidence ${r.confidenceLabel.toLowerCase()} (${r.confidenceScore.toFixed(2)})`,
    ];
    if (profitImpact != null) reasons.push(`Profit signal (normalized): ${profitImpact.toFixed(2)}`);
    if (urgencyScore != null) reasons.push(`Urgency (normalized): ${urgencyScore.toFixed(2)}`);
    const warnings: string[] = [...(r.warnings ?? [])];
    if (r.confidenceLabel === "LOW") warnings.push("Low confidence — treat as exploratory.");

    scored.push({
      id: r.id,
      source: r.source,
      actionType: r.actionType,
      entityId: r.targetId ?? null,
      priorityScore,
      trustScore,
      profitImpact,
      confidenceScore: r.confidenceScore,
      urgencyScore,
      conflictGroup: null,
      reasons,
      warnings,
    });
  }

  return applyConflictGroups(scored, groups);
}

function whyTrust(trust: number, adaptiveW: number, adaptiveOn: boolean): string {
  if (adaptiveOn) {
    return `Trust ${trust.toFixed(3)} (base × adaptive weight ${adaptiveW.toFixed(3)})`;
  }
  return `Trust ${trust.toFixed(3)} (One Brain base; adaptive weighting off)`;
}
