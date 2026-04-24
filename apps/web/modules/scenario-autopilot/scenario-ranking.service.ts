import type { EnrichedCandidate, RankingResult } from "./scenario-autopilot.types";

function riskWeight(level: EnrichedCandidate["riskLevel"]): number {
  switch (level) {
    case "critical":
      return 22;
    case "high":
      return 12;
    case "medium":
      return 5;
    default:
      return 0;
  }
}

function confidenceWeight(c: EnrichedCandidate["simulation"]["confidenceLevel"]): number {
  if (c === "high") return 4;
  if (c === "medium") return 1;
  return -3;
}

/**
 * Rank by expected upside minus risk, adjusted for confidence, reversibility, governance, effort.
 */
export function rankEnrichedCandidates(candidates: EnrichedCandidate[]): RankingResult {
  if (candidates.length === 0) {
    throw new Error("rankEnrichedCandidates: empty");
  }

  const scored = candidates.map((c) => {
    const n = c.normalized;
    const upside = n.revenueDelta * 1.15 + n.conversionDelta * 1.8 + n.trustImpact * 0.08;
    const downside = n.disputeRiskDelta * 1.4 + n.operationalComplexity * 6 + riskWeight(c.riskLevel);
    const revBonus = c.reversible ? 3 : -8;
    const govPenalty = c.requiresHighTierApproval && (c.parameters.pricingAdjustment > 0.04 || c.riskLevel === "critical") ? 4 : 0;
    const effortPenalty = c.effortScore * 4;
    const conf = confidenceWeight(c.simulation.confidenceLevel);
    const score = upside - downside + revBonus - govPenalty - effortPenalty + conf;
    return {
      candidate: c,
      score,
      breakdown: {
        upside,
        downside,
        revBonus,
        govPenalty,
        effortPenalty,
        confidence: conf,
      },
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]!.candidate;
  const alts = scored.slice(1, 4).map((s) => s.candidate);

  const bestWhy = `Highest composite score: revenue/conversion lift (${best.normalized.revenueDelta.toFixed(1)}% / ${best.normalized.conversionDelta.toFixed(1)} pts) net of dispute risk and effort, with ${best.reversible ? "reversibility" : "limited reversibility"}.`;
  const lowerWhys = scored.slice(1, 4).map((s, i) => {
    const c = s.candidate;
    return `${i + 2}. ${c.title}: score ${s.score.toFixed(1)} — ${s.breakdown.downside > s.breakdown.upside * 0.4 ? "risk/effort dominated" : "slightly lower upside or confidence"} (${c.domain}).`;
  });

  return {
    best,
    topAlternatives: alts,
    all: scored.map((s) => s.candidate),
    reasonBestWon: bestWhy,
    reasonAlternativesLower: lowerWhys,
    scores: scored.map((s) => ({
      candidateId: s.candidate.id,
      score: Math.round(s.score * 100) / 100,
      breakdown: s.breakdown,
    })),
  };
}
