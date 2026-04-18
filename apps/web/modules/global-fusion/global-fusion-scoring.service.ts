/**
 * Bounded fusion scores — local weights only; does not alter source engine scores.
 * Phase E: source weights may follow Fusion-local learning when adaptive flags are on (see `global-fusion-learning-weights.service`).
 */
import type { GlobalFusionConflict, GlobalFusionNormalizedSignal, GlobalFusionScore } from "./global-fusion.types";
import { getGlobalFusionCurrentWeights } from "./global-fusion-learning-weights.service";

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

export function computeGlobalFusionScores(
  signals: GlobalFusionNormalizedSignal[],
  conflicts: GlobalFusionConflict[],
): GlobalFusionScore {
  const W = getGlobalFusionCurrentWeights();
  const bySource = Object.fromEntries(
    (["brain", "ads", "cro", "ranking"] as const).map((s) => [s, [] as GlobalFusionNormalizedSignal[]]),
  ) as Record<string, GlobalFusionNormalizedSignal[]>;
  for (const sig of signals) {
    bySource[sig.source]?.push(sig);
  }

  let fusedConfidence = 0;
  let fusedPriority = 0;
  let fusedRisk = 0;
  let evidenceAcc = 0;
  let wSum = 0;

  for (const src of ["brain", "ads", "cro", "ranking"] as const) {
    const w = W[src];
    const rows = bySource[src];
    if (!rows?.length) continue;
    const avg = (fn: (s: GlobalFusionNormalizedSignal) => number | null) => {
      const vals = rows.map(fn).filter((x): x is number => x != null && Number.isFinite(x));
      if (!vals.length) return null;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    };
    const c = avg((s) => s.confidence);
    const p = avg((s) => s.priority);
    const r = avg((s) => s.risk);
    const e = avg((s) => s.evidenceQuality);
    if (c != null) fusedConfidence += c * w;
    if (p != null) fusedPriority += p * w;
    if (r != null) fusedRisk += r * w;
    if (e != null) {
      evidenceAcc += e * w;
      wSum += w;
    }
  }

  const disagreementPenalty = Math.min(0.35, conflicts.length * 0.06);
  const agreementScore = clamp01(1 - disagreementPenalty - fusedRisk * 0.25);
  const evidenceScore = wSum > 0 ? clamp01(evidenceAcc / wSum) : 0.35;

  const actionability = clamp01(fusedConfidence * 0.45 + agreementScore * 0.35 + evidenceScore * 0.2 - fusedRisk * 0.15);

  return {
    fusedConfidence: clamp01(fusedConfidence),
    fusedPriority: clamp01(fusedPriority),
    fusedRisk: clamp01(fusedRisk),
    actionability: clamp01(actionability),
    agreementScore: clamp01(agreementScore),
    evidenceScore: clamp01(evidenceScore),
  };
}
