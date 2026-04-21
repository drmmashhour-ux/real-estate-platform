import type { PlaybookScoreBand } from "@prisma/client";

/** Composite playbook aggregate score → band mapping (deterministic thresholds). */
export function aggregateNumericScore(params: {
  avgConversionLift?: number | null;
  avgRealizedRevenue?: number | null;
  avgRealizedValue?: number | null;
  avgRiskScore?: number | null;
  totalExecutions: number;
  successfulExecutions: number;
}): number {
  const lift = params.avgConversionLift ?? 0;
  const rev = normalizeRevenue(params.avgRealizedRevenue ?? params.avgRealizedValue ?? 0);
  const succ =
    params.totalExecutions > 0 ? params.successfulExecutions / params.totalExecutions : 0;
  const risk = params.avgRiskScore ?? 0;
  const raw =
    lift * 0.28 +
    rev * 0.22 +
    succ * 0.35 -
    Math.min(1, risk) * 0.25;
  return clamp01(raw);
}

function normalizeRevenue(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return clamp01(Math.tanh(x / 50_000));
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

export function numericScoreToBand(score: number): PlaybookScoreBand {
  if (score >= 0.82) return "ELITE";
  if (score >= 0.62) return "HIGH";
  if (score >= 0.38) return "MEDIUM";
  return "LOW";
}

/** Candidate ranking from spec §12 (hybrid). */
export function hybridCandidateScore(parts: {
  similarityScore: number;
  playbookPerformanceScore: number;
  contextMatchScore: number;
  recencyScore: number;
  confidenceScore: number;
}): number {
  return clamp01(
    parts.similarityScore * 0.35 +
      parts.playbookPerformanceScore * 0.3 +
      parts.contextMatchScore * 0.15 +
      parts.recencyScore * 0.1 +
      parts.confidenceScore * 0.1,
  );
}

export function confidenceFromExecutionStats(executions: number, recentDaysHint = 30): number {
  const sample = Math.min(1, Math.log10(1 + Math.max(0, executions)) / 2);
  const recency = Math.min(1, 14 / Math.max(1, recentDaysHint));
  return clamp01(sample * recency);
}
