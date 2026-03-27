import { logInfo, logWarning } from "@/lib/logging";

/** In-process counters for lightweight diagnostics (reset on deploy). Not a replacement for APM. */
const counters = {
  apiLatencySamples: [] as number[],
  errors: 0,
  critical: 0,
};

const MAX_SAMPLES = 500;

export function trackApiLatency(durationMs: number, meta?: { route?: string }) {
  if (durationMs < 0 || durationMs > 600_000) return;
  counters.apiLatencySamples.push(durationMs);
  if (counters.apiLatencySamples.length > MAX_SAMPLES) {
    counters.apiLatencySamples.splice(0, counters.apiLatencySamples.length - MAX_SAMPLES);
  }
  if (durationMs > 10_000) {
    logWarning("slow_api_request", { action: meta?.route, meta: { durationMs } });
  }
}

export function trackError(source: string, meta?: Record<string, unknown>) {
  counters.errors += 1;
  logInfo("metric_error", { action: source, meta });
}

export function trackCriticalEvent(source: string, meta?: Record<string, unknown>) {
  counters.critical += 1;
  logWarning("metric_critical", { action: source, meta });
}

export function getMetricsSnapshot() {
  const samples = counters.apiLatencySamples;
  const sorted = [...samples].sort((a, b) => a - b);
  const p50 = sorted.length ? sorted[Math.floor(sorted.length * 0.5)] : null;
  const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : null;
  return {
    errorCount: counters.errors,
    criticalCount: counters.critical,
    latencySampleCount: samples.length,
    latencyP50Ms: p50,
    latencyP95Ms: p95,
  };
}
