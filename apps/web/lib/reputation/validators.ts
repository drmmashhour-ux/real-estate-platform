import type { ReputationLevel } from "@prisma/client";

export const REP_SCORE_MIN = 0;
export const REP_SCORE_MAX = 100;

export function clampRepScore(n: number): number {
  if (!Number.isFinite(n)) return REP_SCORE_MIN;
  return Math.min(REP_SCORE_MAX, Math.max(REP_SCORE_MIN, Math.round(n)));
}

export function reputationLevelFromScore(score: number): ReputationLevel {
  const s = clampRepScore(score);
  if (s < 30) return "poor";
  if (s < 55) return "fair";
  if (s < 80) return "good";
  return "excellent";
}

export function scaleStarRatingTo100(avg1to5: number | null): number {
  if (avg1to5 == null || !Number.isFinite(avg1to5)) return 45;
  const c = Math.min(5, Math.max(1, avg1to5));
  return clampRepScore(((c - 1) / 4) * 100);
}
