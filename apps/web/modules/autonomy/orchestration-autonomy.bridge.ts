import type { BuildCandidatesInput } from "@/modules/autonomy/autonomy.types";

/** Attach orchestration / playbook / reinforcement metadata for audit (Phase 12). */
export function attachOrchestrationMeta(
  input: BuildCandidatesInput,
  meta: { runId?: string; strategyKey?: string; assignmentId?: string }
): BuildCandidatesInput {
  return {
    ...input,
    sourceOrchestrationRunId: meta.runId ?? input.sourceOrchestrationRunId,
    sourceStrategyKey: meta.strategyKey ?? input.sourceStrategyKey,
    sourceAssignmentId: meta.assignmentId ?? input.sourceAssignmentId,
  };
}
