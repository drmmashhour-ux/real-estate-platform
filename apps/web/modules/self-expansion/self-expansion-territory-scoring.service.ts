import type {
  ExpansionLearningWeights,
  ExpansionRecommendationActionBand,
  TerritoryExpansionProfile,
  TerritoryScoreResult,
} from "@/modules/self-expansion/self-expansion.types";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function bandFromComposite(
  score: number,
  readinessBand: string,
  blockers: string[]
): ExpansionRecommendationActionBand {
  const hardBlock =
    blockers.some((b) => /regulatory|sanction|pause/i.test(b)) ||
    readinessBand === "NOT_READY";
  if (hardBlock && score < 42) return "PAUSE";
  if (score >= 78 && readinessBand === "PRIORITY") return "SCALE";
  if (score >= 62 && ["READY", "PRIORITY"].includes(readinessBand)) return "ENTER";
  if (score >= 48 || readinessBand === "EMERGING") return "PREPARE";
  if (score >= 35) return "WATCH";
  return "PAUSE";
}

/** Weighted composite 0–100 — not revenue guidance; ranking only. */
export function scoreTerritoryExpansion(
  p: TerritoryExpansionProfile,
  learning?: ExpansionLearningWeights | null
): TerritoryScoreResult {
  const revenuePotential = clamp01(p.currentTraction.revenueCents / 500_000_000 + p.currentTraction.bookings / 600);
  const growthPotential = clamp01(0.45 + p.currentTraction.growthRate);
  const imbalance =
    p.supplySignals.ratio < 0.85 ? clamp01((0.85 - p.supplySignals.ratio) * 4)
    : p.supplySignals.ratio > 1.15 ? clamp01((p.supplySignals.ratio - 1.05) * 2)
    : 0.35;
  const strategicFit = clamp01(p.strategicFit / 100);
  const competitorWeakness = clamp01(1 - p.competitorPressure / 12);
  const opsFeasibility = clamp01(p.operationalCapacity / 100 + p.brokerDensity / 120);
  const launchReadiness = clamp01(p.readinessScore / 100);
  const localizationPenalty =
    p.regulatoryReadinessFlags.filter((f) => /restricted|blocked|review_required/i.test(f)).length * 6;

  let composite =
    22 * revenuePotential +
    18 * growthPotential +
    14 * imbalance +
    12 * strategicFit +
    10 * competitorWeakness +
    10 * opsFeasibility +
    14 * launchReadiness -
    localizationPenalty;

  const archeLift = learning?.archetypeLift[p.archetype] ?? 1;
  const hubKeys = learning?.hubLift ? Object.keys(learning.hubLift) : [];
  const hubLiftAvg =
    hubKeys.length > 0 ?
      Object.values(learning.hubLift).reduce((a, b) => a + b, 0) / hubKeys.length
    : 1;
  composite *= (archeLift + hubLiftAvg) / 2;

  const strengths: string[] = [];
  const blockers: string[] = [];

  if (launchReadiness > 0.62) strengths.push("Readiness band supports staged entry");
  else blockers.push("Readiness still building — keep discovery cadence");

  if (competitorWeakness > 0.55) strengths.push("Competitive pressure tractable vs peers");
  else blockers.push("Incumbent pressure elevated — differentiate routing + BNHub depth");

  if (imbalance > 0.45) strengths.push("Supply/demand imbalance creates wedge");
  if (p.regulatoryReadinessFlags.length) {
    blockers.push(`Regulatory/config flags: ${p.regulatoryReadinessFlags.slice(0, 3).join(", ")}`);
  }

  for (const b of blockers) {
    const pen = learning?.blockerPenalty[b];
    if (pen != null) {
      /* learning adjusts narrative weight only — score nudge capped */
      composite -= Math.min(8, pen * 4);
    }
  }

  const adjustedScore = Math.round(Math.max(0, Math.min(100, composite)));

  const confidenceRaw =
    0.42 +
    launchReadiness * 0.22 +
    strategicFit * 0.18 +
    (p.coverageWarnings?.length ? -0.12 : 0);
  const confidence = clamp01(confidenceRaw);

  return {
    territoryId: p.territoryId,
    expansionScore: adjustedScore,
    confidence,
    strengths,
    blockers,
    recommendedActionBand: bandFromComposite(adjustedScore, p.readinessBand, blockers),
  };
}
