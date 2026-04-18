import { evaluateGuardrails } from "./guardrail-engine.service";
import type { AssistantRecommendation } from "./operator.types";
import { resolveConflicts } from "./operator-conflict-engine.service";
import { scoreAssistantRecommendations } from "./operator-recommendation-brain.service";
import type { OperatorExecutionPlan, OperatorScoredRecommendation } from "./operator-v2.types";

const DEFAULT_BATCH = 8;
const MIN_BATCH = 5;
const MAX_BATCH = 10;

function byRecId(recs: AssistantRecommendation[]): Map<string, AssistantRecommendation> {
  return new Map(recs.map((r) => [r.id, r]));
}

export function buildExecutionPlanFromScored(input: {
  recommendations: AssistantRecommendation[];
  scored: OperatorScoredRecommendation[];
  environment: "development" | "staging" | "production";
  maxBatch?: number;
  resolveConflicts: boolean;
}): OperatorExecutionPlan {
  const notes: string[] = [];
  const maxBatch = clampBatch(input.maxBatch ?? DEFAULT_BATCH);
  const byId = byRecId(input.recommendations);

  let working = [...input.scored].sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    return a.id.localeCompare(b.id);
  });

  let resolutions: OperatorExecutionPlan["conflicts"] = [];
  if (input.resolveConflicts) {
    const out = resolveConflicts(working);
    working = out.kept.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
      return a.id.localeCompare(b.id);
    });
    resolutions = out.resolutions;
    notes.push(`Conflict engine: ${resolutions.length} group(s) resolved deterministically by priorityScore.`);
  } else {
    notes.push("Conflict engine disabled — all scored items kept (may include competing actions).");
  }

  const passed: OperatorScoredRecommendation[] = [];
  let blocked = 0;
  for (const s of working) {
    const rec = byId.get(s.id);
    if (!rec) {
      notes.push(`Skipped unknown id ${s.id} (missing AssistantRecommendation).`);
      continue;
    }
    const g = evaluateGuardrails({ recommendation: rec, environment: input.environment });
    if (!g.allowed) {
      blocked += 1;
      continue;
    }
    passed.push(s);
  }

  const rankedFull = [...passed];
  const ordered = rankedFull.slice(0, maxBatch);

  notes.push(`Guardrails: ${blocked} blocked, ${passed.length} pass.`);
  notes.push(`Execution batch cap: ${maxBatch} (ordered list).`);

  return {
    totalRecommendations: input.recommendations.length,
    approvedCount: passed.length,
    blockedCount: blocked,
    ordered,
    conflicts: resolutions,
    notes,
    rankedFull,
  };
}

export async function buildExecutionPlan(input: {
  recommendations: AssistantRecommendation[];
  environment: "development" | "staging" | "production";
  maxBatch?: number;
  resolveConflicts?: boolean;
}): Promise<OperatorExecutionPlan> {
  const scored = await scoreAssistantRecommendations(input.recommendations);
  return buildExecutionPlanFromScored({
    recommendations: input.recommendations,
    scored,
    environment: input.environment,
    maxBatch: input.maxBatch,
    resolveConflicts: input.resolveConflicts ?? true,
  });
}

function clampBatch(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_BATCH;
  return Math.max(MIN_BATCH, Math.min(MAX_BATCH, Math.floor(n)));
}
