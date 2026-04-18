/**
 * Fusion-local source weights only — never writes to Brain/Ads/CRO/Ranking stores.
 */
import { globalFusionFlags } from "@/config/feature-flags";
import { isFusionLearningFrozen } from "./global-fusion-freeze.service";
import type { GlobalFusionLearningAdjustment, GlobalFusionSource } from "./global-fusion.types";
import {
  GF_LEARN_MAX_TOTAL_DRIFT_FROM_DEFAULT,
  GF_LEARN_MAX_WEIGHT_DELTA_PER_RUN,
} from "./global-fusion-learning.constants";

/** Static defaults (must match historical fusion scoring defaults). */
export const GLOBAL_FUSION_DEFAULT_SOURCE_WEIGHTS: Record<GlobalFusionSource, number> = {
  brain: 0.28,
  ads: 0.24,
  cro: 0.26,
  ranking: 0.22,
};

type FactorWeights = {
  agreementBlend: number;
  evidenceBlend: number;
  riskPenalty: number;
};

const DEFAULT_FACTORS: FactorWeights = {
  agreementBlend: 1,
  evidenceBlend: 1,
  riskPenalty: 1,
};

let learnedSource = { ...GLOBAL_FUSION_DEFAULT_SOURCE_WEIGHTS };
let learnedFactors = { ...DEFAULT_FACTORS };

function normalizeWeights(w: Record<GlobalFusionSource, number>): Record<GlobalFusionSource, number> {
  const sum = (["brain", "ads", "cro", "ranking"] as const).reduce((a, k) => a + Math.max(0.01, w[k]), 0);
  const out = {} as Record<GlobalFusionSource, number>;
  for (const k of ["brain", "ads", "cro", "ranking"] as const) {
    out[k] = Math.max(0.05, Math.min(0.45, w[k] / sum));
  }
  const s2 = (["brain", "ads", "cro", "ranking"] as const).reduce((a, k) => a + out[k], 0);
  for (const k of ["brain", "ads", "cro", "ranking"] as const) {
    out[k] = out[k] / s2;
  }
  return out;
}

function driftL1(w: Record<GlobalFusionSource, number>): number {
  let d = 0;
  for (const k of ["brain", "ads", "cro", "ranking"] as const) {
    d += Math.abs(w[k] - GLOBAL_FUSION_DEFAULT_SOURCE_WEIGHTS[k]);
  }
  return d;
}

export function getGlobalFusionCurrentWeights(): Record<GlobalFusionSource, number> {
  if (
    isFusionLearningFrozen() ||
    !globalFusionFlags.globalFusionLearningV1 ||
    !globalFusionFlags.globalFusionLearningAdaptiveWeightsV1
  ) {
    return { ...GLOBAL_FUSION_DEFAULT_SOURCE_WEIGHTS };
  }
  return normalizeWeights({ ...learnedSource });
}

export function getGlobalFusionFactorWeights(): FactorWeights {
  if (
    isFusionLearningFrozen() ||
    !globalFusionFlags.globalFusionLearningV1 ||
    !globalFusionFlags.globalFusionLearningAdaptiveWeightsV1
  ) {
    return { ...DEFAULT_FACTORS };
  }
  return { ...learnedFactors };
}

export function computeGlobalFusionWeightAdjustments(
  sourceHitRates: Partial<Record<GlobalFusionSource, number>>,
  globalHit: number | null,
): GlobalFusionLearningAdjustment[] {
  const out: GlobalFusionLearningAdjustment[] = [];
  if (globalHit == null || !Number.isFinite(globalHit)) {
    for (const source of ["brain", "ads", "cro", "ranking"] as const) {
      out.push({
        source,
        delta: 0,
        reason: "no_global_baseline",
        blocked: true,
        blockedReason: "insufficient_evidence",
      });
    }
    return out;
  }

  for (const source of ["brain", "ads", "cro", "ranking"] as const) {
    const hr = sourceHitRates[source];
    if (hr == null || !Number.isFinite(hr)) {
      out.push({
        source,
        delta: 0,
        reason: "missing_source_hit_rate",
        blocked: true,
        blockedReason: "insufficient_evidence",
      });
      continue;
    }
    const diff = hr - globalHit;
    const raw = Math.sign(diff) * Math.min(GF_LEARN_MAX_WEIGHT_DELTA_PER_RUN, Math.abs(diff) * 0.08);
    const delta = Math.abs(raw) < 0.001 ? 0 : raw;
    out.push({
      source,
      delta,
      reason: `hit_vs_global:${(diff * 100).toFixed(1)}pp`,
      blocked: false,
    });
  }
  return out;
}

export function applyGlobalFusionWeightAdjustments(adjustments: GlobalFusionLearningAdjustment[]): number {
  if (
    isFusionLearningFrozen() ||
    !globalFusionFlags.globalFusionLearningV1 ||
    !globalFusionFlags.globalFusionLearningAdaptiveWeightsV1
  ) {
    return 0;
  }
  const next = { ...learnedSource };
  let count = 0;
  for (const a of adjustments) {
    if (a.blocked || a.delta === 0) continue;
    const d = Math.max(-GF_LEARN_MAX_WEIGHT_DELTA_PER_RUN, Math.min(GF_LEARN_MAX_WEIGHT_DELTA_PER_RUN, a.delta));
    next[a.source] += d;
    count++;
  }
  const normalized = normalizeWeights(next);
  if (driftL1(normalized) > GF_LEARN_MAX_TOTAL_DRIFT_FROM_DEFAULT) {
    return 0;
  }
  learnedSource = normalized;
  return count;
}

export function resetGlobalFusionWeightsForTests(): void {
  learnedSource = { ...GLOBAL_FUSION_DEFAULT_SOURCE_WEIGHTS };
  learnedFactors = { ...DEFAULT_FACTORS };
}

export function getWeightDriftFromDefaultL1(): number {
  return driftL1(normalizeWeights({ ...learnedSource }));
}
