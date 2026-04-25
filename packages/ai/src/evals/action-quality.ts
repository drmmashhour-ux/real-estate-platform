import type { ExecutionResult } from "../execution/execution-result";

export function scoreActionBatch(results: ExecutionResult[]): number {
  if (results.length === 0) return 0;
  const ok = results.filter((r) => r.ok).length;
  return ok / results.length;
}
