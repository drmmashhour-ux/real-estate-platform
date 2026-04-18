import type { ExecutionResult } from "../../types/domain.types";

/** Shared DRY_RUN payload — no DB writes; `detail` and `message` match for API consumers. */
export function buildDryRunResult(message: string, metadata: Record<string, unknown> = {}): ExecutionResult {
  const startedAt = new Date().toISOString();
  return {
    status: "DRY_RUN",
    startedAt,
    finishedAt: new Date().toISOString(),
    detail: message,
    message,
    metadata: { ...metadata, dryRun: true },
  };
}
