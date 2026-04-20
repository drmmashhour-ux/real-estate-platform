import type { GrowthSeverity } from "../growth.types";
import type { GrowthSignal } from "../growth.types";

export function stableSignalId(parts: string[]): string {
  return parts
    .map((p) => String(p).replace(/[|:]/g, "_").slice(0, 64))
    .join(":");
}

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function severityFromRatio(ratio: number, invert: boolean): GrowthSeverity {
  const v = invert ? 1 - ratio : ratio;
  if (v >= 0.66) return "critical";
  if (v >= 0.33) return "warning";
  return "info";
}

export function dedupeGrowthSignals(signals: GrowthSignal[]): GrowthSignal[] {
  const seen = new Set<string>();
  const out: GrowthSignal[] = [];
  for (const s of signals) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    out.push(s);
  }
  return out;
}

export function median(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const s = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function explain(prefix: string, facts: Record<string, string | number | null | undefined>): string {
  const bits = Object.entries(facts)
    .map(([k, v]) => `${k}=${v ?? "n/a"}`)
    .join("; ");
  return `${prefix} (${bits})`;
}
