import { logInfo } from "@/lib/logger";

const TAG = "[evolution]";

export type EvolutionLogKind = "strategy_applied" | "outcome" | "adjustment" | "rollout";

export function logEvolution(kind: EvolutionLogKind, meta: Record<string, unknown>): void {
  const finalTag = kind === "rollout" ? "[evolution-rollout]" : TAG;
  logInfo(`${finalTag} ${kind}`, meta);
}
