/**
 * Trust scoring for One Brain — combines confidence, evidence, and learning presence (no fabricated signals).
 * Optional adaptive source weight (One Brain V2) multiplies the base score and is capped at 1.0; it does not bypass guardrails.
 */

import type { BrainLearningSource, BrainSourceWeight } from "./brain-v2.types";

export type TrustScoreInput = {
  confidenceScore: number;
  evidenceScore?: number | null;
  learningSignals?: string[];
  /** Present on One Brain decision inputs; OPERATOR maps to UNIFIED for adaptive weights elsewhere. */
  source?: BrainLearningSource | "OPERATOR";
  /** Adaptive multiplier from persisted snapshots; defaults to 1.0 when absent. */
  sourceWeight?: number | null;
};

export function computeBaseTrustScore(input: TrustScoreInput): number {
  const confidence = input.confidenceScore ?? 0.3;
  const evidence = input.evidenceScore ?? 0.3;
  const learningBoost = input.learningSignals?.length ? 0.1 : 0;
  const trust = confidence * 0.5 + evidence * 0.4 + learningBoost;
  return Math.min(1, Number(trust.toFixed(3)));
}

export function getSourceAdaptiveWeight(
  source: BrainLearningSource | undefined,
  snapshot: BrainSourceWeight[] | null | undefined,
): number {
  if (!source || !snapshot?.length) return 1;
  const row = snapshot.find((s) => s.source === source);
  return row?.weight != null && Number.isFinite(row.weight) ? row.weight : 1;
}

export function computeTrustScore(input: TrustScoreInput): number {
  const base = computeBaseTrustScore(input);
  const w = input.sourceWeight ?? 1.0;
  const trust = base * w;
  return Math.min(1, Number(trust.toFixed(3)));
}

export function computeExecutionPriority(trustScore: number) {
  if (trustScore >= 0.8) return 3;
  if (trustScore >= 0.6) return 2;
  return 1;
}

export function isExecutionAllowed(trustScore: number) {
  return trustScore >= 0.65;
}
