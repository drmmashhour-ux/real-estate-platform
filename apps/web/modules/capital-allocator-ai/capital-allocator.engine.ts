import type {
  DealCapitalAllocatorInput,
  DealCapitalAllocatorResult,
  DealCapitalAllocatorRiskLevel,
  ExpectedReturnBand,
} from "./capital-allocator.types";

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function returnBandMultiplier(band: ExpectedReturnBand): number {
  switch (band) {
    case "LOW":
      return 0.9;
    case "HIGH":
      return 1.12;
    default:
      return 1;
  }
}

function riskLevelMultiplier(level: DealCapitalAllocatorRiskLevel, riskScore: number): number {
  const fromNumeric = 1 + 1.75 * clamp(riskScore, 0, 1);
  const fromLabel =
    level === "HIGH" ? 2.15
    : level === "MEDIUM" ? 1.45
    : level === "LOW" ? 1
    : fromNumeric;
  return Math.max(fromNumeric, fromLabel * 0.85);
}

/**
 * Higher active deal count → lower per-deal ceiling (diversify).
 * `diversificationScore` from service is 0–1 (higher = more diversified book).
 */
function maxAllocationPercentForPortfolio(diversificationScore: number): number {
  const concentration = 1 - clamp(diversificationScore, 0, 1);
  return clamp(0.38 - 0.14 * concentration, 0.12, 0.38);
}

function esgMultiplier(esgScore: number): number {
  return 0.88 + 0.12 * clamp(esgScore, 0, 1);
}

/**
 * Pure advisory allocator: higher risk → lower %; strong return + low risk → higher %;
 * portfolio diversification lowers the ceiling for any single deal.
 */
export function computeDealCapitalAllocation(input: DealCapitalAllocatorInput): DealCapitalAllocatorResult {
  const notes: string[] = [];
  const ds = clamp(input.dealScore, 0, 1);
  const cp = clamp(input.closeProbability, 0, 1);
  const esg = clamp(input.esgScore, 0, 1);
  const rk = clamp(input.riskScore, 0, 1);
  const div = clamp(input.diversificationScore, 0, 1);

  const returnAdj = returnBandMultiplier(input.expectedReturnBand);
  const riskAdj = riskLevelMultiplier(input.riskLevel, rk);
  const esgAdj = esgMultiplier(esg);
  const maxPct = maxAllocationPercentForPortfolio(div);

  const qualityCore = (0.45 * ds + 0.35 * cp + 0.2 * esg) * returnAdj;
  const qualityFactor = clamp(qualityCore / riskAdj, 0.08, 1.35);

  if (input.riskLevel === "HIGH" || rk >= 0.72) {
    notes.push("Elevated risk — allocation scaled down.");
  }
  if (input.expectedReturnBand === "HIGH" && input.riskLevel !== "HIGH" && rk < 0.55) {
    notes.push("Higher expected return with moderate risk — allocation bias upward (within cap).");
  }
  if (div < 0.35) {
    notes.push("Portfolio concentration is high — per-deal cap tightened to diversify.");
  }

  const minPct = 0.03;
  let allocationPercent = minPct + (maxPct - minPct) * ((qualityFactor - 0.08) / (1.35 - 0.08));
  allocationPercent = clamp(allocationPercent, minPct, maxPct);

  const pool = Math.max(0, Math.floor(input.totalDeployableCapitalCents));
  let recommendedAmountCents = Math.round(allocationPercent * pool);
  if (pool > 0 && recommendedAmountCents < 1 && allocationPercent > 0) {
    recommendedAmountCents = 1;
  }
  if (recommendedAmountCents > pool) {
    recommendedAmountCents = pool;
  }

  const usedPct = pool > 0 ? recommendedAmountCents / pool : 0;
  allocationPercent = pool > 0 ? usedPct : allocationPercent;

  /** Baseline; caller may adjust using raw CRM field presence. */
  let confidencePenalty = 0;
  if (input.riskLevel === "UNKNOWN") confidencePenalty += 14;
  if (div < 0.25) confidencePenalty += 8;
  const confidenceScore = clamp(90 - confidencePenalty, 42, 96);

  const justificationParts = [
    `Recommended ${(allocationPercent * 100).toFixed(1)}% of the declared deployable pool`,
    `(~$${(recommendedAmountCents / 100).toLocaleString("en-CA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CAD)`,
    `based on deal quality ${(ds * 100).toFixed(0)}%, close likelihood ${(cp * 100).toFixed(0)}%,`,
    `ESG tilt, ${input.expectedReturnBand.toLowerCase()} return band, and risk posture`,
    `with a ${(maxPct * 100).toFixed(0)}% ceiling to support diversification.`,
  ];

  const reasoningJson = {
    version: 1 as const,
    inputs: {
      dealScore: input.dealScore,
      riskScore: input.riskScore,
      closeProbability: input.closeProbability,
      esgScore: input.esgScore,
      expectedReturnBand: input.expectedReturnBand,
      diversificationScore: input.diversificationScore,
      riskLevel: input.riskLevel,
      totalDeployableCapitalCents: input.totalDeployableCapitalCents,
    },
    factors: {
      esgAdjustment: esgAdj,
      returnAdjustment: returnAdj,
      riskAdjustment: riskAdj,
      diversificationCap: maxPct,
      qualityFactor,
    },
    notes,
  };

  return {
    allocationPercent,
    recommendedAmountCents,
    justification: justificationParts.join(" "),
    reasoningJson,
    confidenceScore,
  };
}
