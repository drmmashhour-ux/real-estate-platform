import type { ExecutionResult } from "./execution-result";

export type QueuedExecution = {
  id: string;
  actionKey: string;
  payload: Record<string, unknown>;
};

export class InMemoryExecutionQueue {
  private q: QueuedExecution[] = [];
  enqueue(item: QueuedExecution) {
    this.q.push(item);
  }
  drain(): QueuedExecution[] {
    const out = [...this.q];
    this.q = [];
    return out;
  }
}

export function mergeResults(results: ExecutionResult[]): { ok: number; failed: number } {
  return {
    ok: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
  };
}
