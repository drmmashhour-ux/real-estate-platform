import type { DealIntelligenceRisk, DealIntelligenceStage } from "./deal.types";

export type ScoreInputs = {
  status: string;
  dealPriceCad: number;
  listPriceCad: number | null;
  /** Last meaningful touch — events, milestones, or deal.updatedAt */
  lastActivityAt: Date;
  now: Date;
  /** Distinct days with at least one intelligence event in the last 14 days */
  activeDays14d: number;
  /** Total intelligence events in last 14d */
  events14d: number;
  visitOrMessageEvents14d: number;
  milestoneCompleted: number;
  milestoneTotal: number;
  negotiationRoundMax: number;
  rejectedProposals: number;
};

const MS_DAY = 86_400_000;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function mapStatusToIntelligenceStage(status: string): DealIntelligenceStage {
  switch (status) {
    case "closed":
      return "CLOSED";
    case "cancelled":
      return "CLOSED";
    case "initiated":
    case "offer_submitted":
      return "VIEWING";
    case "accepted":
    case "inspection":
    case "financing":
    case "closing_scheduled":
      return "NEGOTIATION";
    default:
      return "OFFER";
  }
}

/** Historical prior for close rate by stage — deterministic stand-in for learned model. */
export function stageClosePrior(stage: DealIntelligenceStage): number {
  switch (stage) {
    case "VIEWING":
      return 0.22;
    case "OFFER":
      return 0.35;
    case "NEGOTIATION":
      return 0.62;
    case "CLOSED":
      return statusClosedProbability;
    default:
      return 0.4;
  }
}

const statusClosedProbability = 0.97;

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, (b.getTime() - a.getTime()) / MS_DAY);
}

/**
 * Weighted 0–100 deal score from activity, engagement, price fit, freshness, negotiation friction.
 */
export function calculateDealScore(input: ScoreInputs): number {
  const daysSince = daysBetween(input.lastActivityAt, input.now);

  const activity = clamp((input.activeDays14d / 10) * 22 + Math.min(input.events14d, 12) * 1.8, 0, 28);

  const engagement = clamp(input.visitOrMessageEvents14d * 6 + input.milestoneCompleted * 3, 0, 26);

  let priceFit = 18;
  if (input.listPriceCad != null && input.listPriceCad > 0) {
    const gap = Math.abs(input.dealPriceCad - input.listPriceCad) / input.listPriceCad;
    priceFit = clamp(20 * (1 - Math.min(1, gap / 0.15)), 0, 20);
  }

  const freshness = clamp(18 - daysSince * 0.65, 0, 18);

  const friction = clamp(input.negotiationRoundMax * 2.2 + input.rejectedProposals * 4, 0, 28);
  const frictionPenalty = clamp(friction * 0.45, 0, 18);

  const raw = activity + engagement + priceFit + freshness - frictionPenalty;
  return Math.round(clamp(raw, 5, 100));
}

export function calculateCloseProbability(dealScore: number, stage: DealIntelligenceStage, status: string): number {
  if (status === "cancelled") return 0.02;
  if (status === "closed") return 0.99;

  const prior = stageClosePrior(stage);
  const scoreBoost = (dealScore / 100) * 0.55;
  const p = prior * 0.45 + scoreBoost;
  return Math.round(clamp(p, 0.04, 0.94) * 1000) / 1000;
}

export function calculateRiskLevel(input: {
  daysSinceLastActivity: number;
  listPriceGapPct: number | null;
  rejectedProposals: number;
  status: string;
}): DealIntelligenceRisk {
  if (input.status === "cancelled") return "HIGH";
  if (input.daysSinceLastActivity > 21) return "HIGH";
  if (input.rejectedProposals >= 3) return "HIGH";
  if (input.listPriceGapPct != null && input.listPriceGapPct > 12) return "HIGH";

  if (input.daysSinceLastActivity > 9 || input.rejectedProposals >= 1 || (input.listPriceGapPct ?? 0) > 7) {
    return "MEDIUM";
  }
  return "LOW";
}
