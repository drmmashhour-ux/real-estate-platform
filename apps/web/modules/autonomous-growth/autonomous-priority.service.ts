import { resolveConflicts } from "@/modules/operator/operator-conflict-engine.service";
import { scoreAssistantRecommendations } from "@/modules/operator/operator-recommendation-brain.service";
import type { OperatorScoredRecommendation } from "@/modules/operator/operator-v2.types";
import type { UnifiedAutonomousRow } from "./autonomous-decision-unifier.service";

/**
 * Deterministic score for a single candidate after trust/priority enrichment (uses Operator brain).
 */
export function scoreAutonomousCandidate(scored: OperatorScoredRecommendation): number {
  return scored.priorityScore;
}

export type PrioritizedAutonomousResult = {
  ordered: UnifiedAutonomousRow[];
  conflictNotes: string[];
  dropped: Array<{ recommendationId: string; note: string }>;
  scoredById: Map<string, OperatorScoredRecommendation>;
};

/**
 * Trust + confidence + profit + urgency via existing Operator scoring; conflicts resolved deterministically.
 */
export async function buildPrioritizedAutonomousCandidates(
  rows: UnifiedAutonomousRow[],
): Promise<PrioritizedAutonomousResult> {
  if (rows.length === 0) {
    return { ordered: [], conflictNotes: [], dropped: [], scoredById: new Map() };
  }

  const assistants = rows.map((r) => r.assistant);
  const scored = await scoreAssistantRecommendations(assistants);
  const scoredById = new Map(scored.map((s) => [s.id, s]));

  const { kept, resolutions } = resolveConflicts(scored);
  const keptIds = new Set(kept.map((k) => k.id));

  const dropped: Array<{ recommendationId: string; note: string }> = [];
  const conflictNotes: string[] = [];
  for (const res of resolutions) {
    conflictNotes.push(
      `Conflict ${res.conflictGroup}: kept ${res.keptRecommendationId} (${res.reason}).`,
    );
    for (const id of res.droppedRecommendationIds) {
      dropped.push({
        recommendationId: id,
        note: `Dropped in favor of ${res.keptRecommendationId} in group ${res.conflictGroup}.`,
      });
    }
  }

  const merged: UnifiedAutonomousRow[] = [];
  for (const row of rows) {
    if (!keptIds.has(row.assistant.id)) continue;
    const s = scoredById.get(row.assistant.id);
    if (!s) continue;
    const next: AutonomousExecutionCandidate = {
      ...row.candidate,
      trustScore: s.trustScore,
      priorityScore: s.priorityScore,
      warnings: [...new Set([...row.candidate.warnings, ...s.warnings])],
      metadata: {
        ...row.candidate.metadata,
        operatorReasons: s.reasons,
        conflictGroup: s.conflictGroup ?? null,
      },
    };
    merged.push({ assistant: row.assistant, candidate: next });
  }

  merged.sort((a, b) => {
    if (b.candidate.priorityScore !== a.candidate.priorityScore) {
      return b.candidate.priorityScore - a.candidate.priorityScore;
    }
    return a.candidate.recommendationId.localeCompare(b.candidate.recommendationId);
  });

  return { ordered: merged, conflictNotes, dropped, scoredById };
}
