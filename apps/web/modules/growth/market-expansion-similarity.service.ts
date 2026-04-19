/**
 * Similarity between two cities’ logged performance shapes — associative only.
 */

import type { CityExpansionSignals } from "@/modules/growth/market-expansion-signals.service";

export type SimilarityResult = {
  similarityScore: number;
  explanation: string;
};

function nz(x?: number): number | undefined {
  return x != null && Number.isFinite(x) ? x : undefined;
}

export function computeCitySimilarity(top: CityExpansionSignals, other: CityExpansionSignals): SimilarityResult {
  const warnings: string[] = [];

  const ta = nz(top.derived.captureRate);
  const tb = nz(top.derived.playbookCompletionRate);
  const tc = nz(top.derived.progressionRate);
  const oa = nz(other.derived.captureRate);
  const ob = nz(other.derived.playbookCompletionRate);
  const oc = nz(other.derived.progressionRate);

  const dims: number[] = [];
  if (ta != null && oa != null) dims.push(1 - Math.min(1, Math.abs(ta - oa)));
  if (tb != null && ob != null) dims.push(1 - Math.min(1, Math.abs(tb - ob)));
  if (tc != null && oc != null) dims.push(1 - Math.min(1, Math.abs(tc - oc)));

  const rTop = nz(top.demandSupplyRatio);
  const rOther = nz(other.demandSupplyRatio);
  if (rTop != null && rOther != null) dims.push(1 - Math.min(1, Math.abs(rTop - rOther)));

  if (dims.length === 0) {
    return {
      similarityScore: 0,
      explanation:
        "Insufficient overlapping derived metrics — cannot compute pattern similarity beyond city labels.",
    };
  }

  let sim = dims.reduce((a, b) => a + b, 0) / dims.length;

  const topN = top.metrics.meta.dataCompleteness;
  const otN = other.metrics.meta.dataCompleteness;
  if (topN === "low" || otN === "low") {
    sim *= 0.82;
    warnings.push("Low completeness on one side — similarity discounted.");
  }

  const similarityScore = Math.round(Math.min(1, Math.max(0, sim)) * 1000) / 1000;

  let explanation =
    `Compared ${dims.length} comparable ratio channel(s); higher score means closer logged shape to the reference city — not causal alignment.`;

  if (warnings.length > 0) explanation += ` ${warnings.join(" ")}`;

  return { similarityScore, explanation };
}
