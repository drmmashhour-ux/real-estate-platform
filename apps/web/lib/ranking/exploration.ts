import { clamp01 } from "./normalize-metrics";

export type ExplorationInput = {
  createdAt: Date;
  views30d: number;
  qualityScore: number;
  /** Typical views in cohort — defaults if unknown */
  medianViewsHint?: number;
};

/**
 * Higher for: new listings, under-exposed inventory with decent quality.
 * Used as 20% blend arm vs 80% performance-oriented rank score.
 */
export function computeExplorationScore(input: ExplorationInput): number {
  const ageDays = (Date.now() - input.createdAt.getTime()) / 86400000;
  const newSupply = Math.exp(-Math.max(0, ageDays - 3) / 45);
  const med = Math.max(5, input.medianViewsHint ?? 24);
  const exposure = 1 / (1 + Math.log1p(input.views30d / med));
  const q = clamp01(input.qualityScore);
  return clamp01(0.42 * newSupply + 0.38 * exposure + 0.2 * q);
}

export function blendPerformanceAndExploration(
  performanceRank0to100: number,
  exploration01: number,
  explorationMix = 0.2
): number {
  const m = Math.max(0, Math.min(0.45, explorationMix));
  return performanceRank0to100 * (1 - m) + exploration01 * 100 * m;
}
