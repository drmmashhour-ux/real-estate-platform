import { logInfo } from "@/lib/logger";

const TAG = "[evolution]";

export type EvolutionLogKind = "strategy_applied" | "outcome" | "adjustment" | "rollout";

export function logEvolution(kind: EvolutionLogKind, meta: Record<string, unknown>): void {
  const finalTag = kind === "rollout" ? "[evolution-rollout]" : TAG;
  
  // Specific event mappings for user requirements
  if (meta.event === "outcome_auto_recorded") {
    logInfo(`${finalTag} outcome_auto_recorded`, meta);
    return;
  }
  if (meta.event === "outcome_skipped_duplicate") {
    logInfo(`${finalTag} outcome_skipped_duplicate`, meta);
    return;
  }

  logInfo(`${finalTag} ${kind}`, meta);
}
