/**
 * Expansion candidate scoring — deterministic 0–100 + readiness/confidence tiers.
 */

import type { ExpansionConfidence, ExpansionReadiness } from "@/modules/growth/market-expansion.types";
import type { CityExpansionSignals } from "@/modules/growth/market-expansion-signals.service";

export type ExpansionScoreResult = {
  score: number;
  readiness: ExpansionReadiness;
  confidence: ExpansionConfidence;
  warnings: string[];
};

/** Weight points (conceptual caps): similarity 38, demand 26, gap 18, inverse competition 12 — renormalized when inputs missing. */

function completenessFactor(c: "high" | "medium" | "low"): number {
  if (c === "high") return 1;
  if (c === "medium") return 0.88;
  return 0.72;
}

export function scoreExpansionCandidate(params: {
  signals: CityExpansionSignals;
  similarityScore: number;
  maxDemandAmongCities: number;
  maxCompetitionAmongCities: number;
  topDemandSupply?: number;
}): ExpansionScoreResult {
  const warnings: string[] = [...params.signals.metrics.meta.warnings];
  const demand = params.signals.demandSignal ?? 0;
  const supply = params.signals.supplyListingCount;
  const comp = params.signals.competitionSignal ?? 0;

  const dn =
    params.maxDemandAmongCities > 0 ? Math.min(1, demand / params.maxDemandAmongCities) : demand > 0 ? 0.5 : 0;

  let gapOp = 0;
  if (
    params.signals.demandSupplyRatio != null &&
    params.topDemandSupply != null &&
    params.topDemandSupply > 0
  ) {
    gapOp = Math.min(1, params.signals.demandSupplyRatio / params.topDemandSupply);
  }

  let invComp = 0;
  if (params.maxCompetitionAmongCities > 0) {
    invComp = 1 - Math.min(1, comp / params.maxCompetitionAmongCities);
  } else if (comp === 0) invComp = 0.55;

  let pts = 0;
  let maxPts = 0;

  pts += 38 * params.similarityScore;
  maxPts += 38;

  pts += 26 * dn;
  maxPts += 26;

  pts += 18 * gapOp;
  maxPts += 18;

  pts += 12 * invComp;
  maxPts += 12;

  let base = maxPts > 0 ? (pts / maxPts) * 100 : 0;

  base *= completenessFactor(params.signals.metrics.meta.dataCompleteness);

  const n = params.signals.metrics.meta.sampleSize;
  let samplePen = 0.68;
  if (n >= 40) samplePen = 1;
  else if (n >= 25) samplePen = 0.9;
  else if (n >= 12) samplePen = 0.8;

  if (n < 12) warnings.push("Very small Fast Deal sample — expansion score discounted.");

  let score = Math.round(Math.min(100, Math.max(0, base * samplePen)));

  let readiness: ExpansionReadiness = "low";
  if (score >= 72 && n >= 25 && params.signals.metrics.meta.dataCompleteness !== "low") readiness = "high";
  else if (score >= 48 && n >= 15) readiness = "medium";

  let confidence: ExpansionConfidence = "low";
  if (n >= 35 && params.signals.metrics.meta.dataCompleteness === "high") confidence = "high";
  else if (n >= 18 && params.signals.metrics.meta.dataCompleteness !== "low") confidence = "medium";

  if (supply == null) warnings.push("Supply listing count unavailable — gap term may be unreliable.");

  return { score, readiness, confidence, warnings };
}
