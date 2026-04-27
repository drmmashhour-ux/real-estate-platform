import type { DrBrainAppId, DrBrainCheckResult } from "../types";

export function runPerformanceChecks(input: { appId: DrBrainAppId }): DrBrainCheckResult[] {
  const { appId } = input;
  const mu = process.memoryUsage?.();
  return [
    {
      appId,
      check: "performance.memory_heap_used_mb",
      level: "INFO",
      ok: true,
      message: mu ? `Approx heap used ${Math.round(mu.heapUsed / 1024 / 1024)} MiB (runner process).` : "Memory usage unavailable.",
    },
  ];
}
