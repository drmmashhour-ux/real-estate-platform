/**
 * Deterministic partial cohorts for safe measurement — no PII in logs.
 */

import type { GrowthAutonomyAutoCohortBucket } from "./growth-autonomy-auto.types";

function stableHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Maps each user to a stable bucket (control / suggest_only / auto_low_risk) for partial rollout.
 */
export function computeAutoLowRiskCohortBucket(userId: string): GrowthAutonomyAutoCohortBucket {
  const mod = stableHash(userId) % 3;
  if (mod === 0) return "control";
  if (mod === 1) return "suggest_only";
  return "auto_low_risk";
}
