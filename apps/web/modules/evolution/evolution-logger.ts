import { logInfo } from "@/lib/logger";

const TAG = "[evolution]";

export type EvolutionLogKind = "strategy_applied" | "outcome" | "adjustment";

export function logEvolution(kind: EvolutionLogKind, meta: Record<string, unknown>): void {
  logInfo(`${TAG} ${kind}`, meta);
}
