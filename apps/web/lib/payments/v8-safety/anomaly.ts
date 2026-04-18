/**
 * Lightweight timing anomaly detection (observational; no behavior change beyond logging).
 */
import { logWarn } from "@/lib/logger";

const NS = "[payments:v8:safety:anomaly]";
const SLOW_MS = 8_000;

const lastDurations = new Map<string, number[]>();
const MAX_SAMPLES = 50;

export function recordOperationDuration(opName: string, ms: number): void {
  const arr = lastDurations.get(opName) ?? [];
  arr.push(ms);
  while (arr.length > MAX_SAMPLES) arr.shift();
  lastDurations.set(opName, arr);
}

export function detectSlowOperation(opName: string, ms: number): void {
  if (ms >= SLOW_MS) {
    logWarn(NS, "slow_operation", { opName, ms, thresholdMs: SLOW_MS });
  }
  const hist = lastDurations.get(opName);
  if (hist && hist.length >= 5) {
    const mean = hist.reduce((a, b) => a + b, 0) / hist.length;
    if (ms > mean * 4 && mean > 100) {
      logWarn(NS, "latency_spike_vs_recent_mean", { opName, ms, mean: Math.round(mean) });
    }
  }
}
