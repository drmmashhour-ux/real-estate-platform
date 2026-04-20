import { prisma } from "@/lib/db";
import type { AutonomyActionCandidate } from "@/modules/autonomy/autonomy.types";
import { getOrCreateRuleWeight } from "@/modules/autonomy/learning/rule-weight.service";
import { computeContextualActionScore } from "./contextual-score.service";
import { extractContextFeatures } from "./context-feature-extractor.service";
import type { ContextFeatures } from "./context.types";

export type RankedContextualAction = AutonomyActionCandidate & {
  contextualScore: number;
  selectionScore: number;
  contextFeatures: ContextFeatures;
};

export async function selectContextualActions(params: {
  scopeType: string;
  scopeId: string;
  candidates: AutonomyActionCandidate[];
  maxActions: number;
}): Promise<RankedContextualAction[]> {
  const features = await extractContextFeatures(params.scopeType, params.scopeId);

  const ranked: RankedContextualAction[] = [];

  for (const candidate of params.candidates) {
    if (!candidate.signalKey) {
      continue;
    }

    const rule = await getOrCreateRuleWeight({
      scopeType: params.scopeType,
      scopeId: params.scopeId,
      domain: candidate.domain,
      signalKey: candidate.signalKey,
      actionType: candidate.actionType,
    });

    const score = await computeContextualActionScore({
      scopeType: params.scopeType,
      scopeId: params.scopeId,
      domain: candidate.domain,
      signalKey: candidate.signalKey,
      actionType: candidate.actionType,
      baseConfidence: candidate.confidence,
      baseRewardWeight: Number(rule.weight ?? 1),
      features,
    });

    ranked.push({
      ...candidate,
      ruleWeightId: rule.id,
      contextualScore: score.contextualScore,
      selectionScore: score.finalScore,
      contextFeatures: features,
    });
  }

  ranked.sort((a, b) => b.selectionScore - a.selectionScore);

  const limit = Math.max(1, params.maxActions);
  return ranked.slice(0, Math.min(limit, ranked.length));
}
