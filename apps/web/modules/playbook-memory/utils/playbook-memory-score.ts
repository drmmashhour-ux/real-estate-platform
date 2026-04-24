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

// --- Wave 3: `PlaybookMemoryRecord` segment similarity + recency (deterministic, no playbooks) ---

export function computeSimilarityScore(a: any, b: any): number {
  if (!a || !b) {
    return 0;
  }

  let score = 0;
  let total = 0;

  for (const key of Object.keys(a)) {
    total++;
    if (a[key] === b[key]) {
      score += 1;
    }
  }

  return total === 0 ? 0 : score / total;
}

export function computeRecencyScore(date: Date): number {
  const now = Date.now();
  const diff = now - new Date(date).getTime();

  const days = diff / (1000 * 60 * 60 * 24);

  if (days < 1) {
    return 1;
  }
  if (days < 7) {
    return 0.8;
  }
  if (days < 30) {
    return 0.6;
  }
  if (days < 90) {
    return 0.4;
  }

  return 0.2;
}

export function computeFinalScore(params: { similarity: number; recency: number }): number {
  return params.similarity * 0.7 + params.recency * 0.3;
}
