import { mapStatusToIntelligenceStage, stageClosePrior } from "./deal-score.calculator";
import type { ScoreInputs } from "./deal-score.calculator";

export type CloseProbabilityCategory = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW";

export type CloseProbabilityFactorKey =
  | "buyerFinancingStrength"
  | "inspectionRisk"
  | "pricingAlignment"
  | "negotiationStability"
  | "sellerMotivation"
  | "documentCompleteness"
  | "timelineFeasibility";

export type CloseProbabilityContext = {
  status: string;
  crmStage: string | null;
  dealCreatedAt: Date;
  now: Date;
  scoreInputs: ScoreInputs;
  listPriceGapPct: number | null;
  daysSinceLastActivity: number;
  hasBrokerExecutionApproval: boolean;
  closingDocuments: {
    required: number;
    verified: number;
    uploaded: number;
    missing: number;
    rejected: number;
  };
  checklist: { total: number; complete: number; blocked: number };
  closingConditions: { pending: number; overdue: number };
  targetClosingDate: Date | null;
  dealDocumentsCount: number;
};

export type FactorRow = {
  score: number;
  weight: number;
  note: string;
};

export type CloseProbabilityEngineResult = {
  probability: number;
  category: CloseProbabilityCategory;
  drivers: string[];
  risks: string[];
  factors: Record<CloseProbabilityFactorKey, FactorRow>;
};

const WEIGHTS: Record<CloseProbabilityFactorKey, number> = {
  buyerFinancingStrength: 0.18,
  inspectionRisk: 0.15,
  pricingAlignment: 0.18,
  negotiationStability: 0.14,
  sellerMotivation: 0.12,
  documentCompleteness: 0.13,
  timelineFeasibility: 0.1,
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, (b.getTime() - a.getTime()) / 86_400_000);
}

export function categoryFromProbability(p: number): CloseProbabilityCategory {
  if (p >= 80) return "VERY_HIGH";
  if (p >= 60) return "HIGH";
  if (p >= 40) return "MEDIUM";
  return "LOW";
}

function scoreBuyerFinancing(status: string, hasApproval: boolean): FactorRow {
  let score = 0.55;
  switch (status) {
    case "closing_scheduled":
      score = 0.88;
      break;
    case "financing":
      score = 0.58;
      break;
    case "accepted":
      score = 0.72;
      break;
    case "inspection":
      score = 0.64;
      break;
    case "initiated":
    case "offer_submitted":
      score = 0.48;
      break;
    case "closed":
      score = 0.97;
      break;
    case "cancelled":
      score = 0.08;
      break;
    default:
      score = 0.55;
  }
  if (hasApproval) score = clamp(score + 0.1, 0, 1);
  return {
    score,
    weight: WEIGHTS.buyerFinancingStrength,
    note: hasApproval ? "Financing path + broker execution attestation on file." : "Inferred from deal status only.",
  };
}

function scoreInspectionRisk(status: string, checklistBlocked: number, conditionsPending: number): FactorRow {
  let score = 0.78;
  if (status === "inspection") score = 0.52;
  if (checklistBlocked > 0) score -= 0.12 * Math.min(3, checklistBlocked);
  if (conditionsPending > 0) score -= 0.06 * Math.min(4, conditionsPending);
  score = clamp(score, 0.12, 1);
  return {
    score,
    weight: WEIGHTS.inspectionRisk,
    note: "Higher = fewer inspection/condition blockers outstanding.",
  };
}

function scorePricingAlignment(listPriceGapPct: number | null): FactorRow {
  let score = 0.68;
  if (listPriceGapPct == null) {
    return {
      score,
      weight: WEIGHTS.pricingAlignment,
      note: "No list price benchmark — neutral alignment.",
    };
  }
  const g = Math.abs(listPriceGapPct);
  if (g <= 2) score = 0.95;
  else if (g <= 5) score = 0.85;
  else if (g <= 9) score = 0.7;
  else if (g <= 14) score = 0.52;
  else score = 0.32;
  return {
    score,
    weight: WEIGHTS.pricingAlignment,
    note: `Offer vs list gap ≈ ${listPriceGapPct.toFixed(1)}%.`,
  };
}

function scoreNegotiationStability(inputs: ScoreInputs): FactorRow {
  const rounds = inputs.negotiationRoundMax;
  const rej = inputs.rejectedProposals;
  const raw = 1 - clamp(rounds * 0.07 + rej * 0.14, 0, 0.85);
  return {
    score: clamp(raw, 0.15, 1),
    weight: WEIGHTS.negotiationStability,
    note: `${rounds} negotiation round(s), ${rej} rejected counter(s).`,
  };
}

function scoreSellerMotivation(crmStage: string | null, dealAgeDays: number): FactorRow {
  const s = (crmStage ?? "").toLowerCase();
  let score = 0.62;
  if (s.includes("accepted") || s.includes("negotiation")) score = 0.82;
  else if (s.includes("offer")) score = 0.7;
  else if (s.includes("visit")) score = 0.58;
  else if (s.includes("new") || s.includes("contact")) score = 0.48;
  if (dealAgeDays > 120) score -= 0.08;
  if (dealAgeDays > 210) score -= 0.06;
  return {
    score: clamp(score, 0.2, 1),
    weight: WEIGHTS.sellerMotivation,
    note: `CRM stage lens: ${crmStage ?? "unset"} · file age ${Math.round(dealAgeDays)}d.`,
  };
}

function scoreDocumentCompleteness(
  closing: CloseProbabilityContext["closingDocuments"],
  dealDocumentsCount: number,
): FactorRow {
  const required = Math.max(1, closing.required);
  const good = closing.verified + Math.min(closing.uploaded, Math.max(0, required - closing.verified)) * 0.65;
  let score = clamp(good / required, 0, 1);
  if (closing.rejected > 0) score -= 0.1 * Math.min(2, closing.rejected);
  if (closing.required === 0 && dealDocumentsCount > 0) score = clamp(0.72 + dealDocumentsCount * 0.02, 0, 0.92);
  if (closing.required === 0 && dealDocumentsCount === 0) score = 0.55;
  score = clamp(score, 0.12, 1);
  return {
    score,
    weight: WEIGHTS.documentCompleteness,
    note:
      closing.required > 0
        ? `${closing.verified}/${required} verified · ${closing.missing} missing · ${closing.rejected} rejected.`
        : `${dealDocumentsCount} deal workspace document(s); closing room not fully seeded.`,
  };
}

function scoreTimeline(
  targetClosingDate: Date | null,
  now: Date,
  checklistBlocked: number,
  status: string,
): FactorRow {
  if (status === "closed") {
    return { score: 0.95, weight: WEIGHTS.timelineFeasibility, note: "Deal already closed." };
  }
  if (!targetClosingDate) {
    return {
      score: 0.64,
      weight: WEIGHTS.timelineFeasibility,
      note: "No target closing date — feasibility neutral.",
    };
  }
  const days = (targetClosingDate.getTime() - now.getTime()) / 86_400_000;
  let score = 0.72;
  if (days < 0) score = 0.28;
  else if (days < 5 && checklistBlocked > 0) score = 0.38;
  else if (days < 10 && checklistBlocked > 1) score = 0.48;
  else if (days < 14) score = 0.58;
  else if (days < 45) score = 0.74;
  else score = 0.68;
  return {
    score,
    weight: WEIGHTS.timelineFeasibility,
    note: `Target close ${targetClosingDate.toISOString().slice(0, 10)} (${Math.round(days)}d).`,
  };
}

const DRIVER_LABELS: Record<CloseProbabilityFactorKey, { high: string; low: string }> = {
  buyerFinancingStrength: { high: "Strong financing posture", low: "Financing uncertainty" },
  inspectionRisk: { high: "Inspection/conditions manageable", low: "Inspection or condition risk" },
  pricingAlignment: { high: "Realistic vs list pricing", low: "Pricing misalignment vs market ask" },
  negotiationStability: { high: "Stable negotiation", low: "Volatile negotiation" },
  sellerMotivation: { high: "Strong seller engagement signals", low: "Weak seller momentum" },
  documentCompleteness: { high: "Document file advancing", low: "Document gaps" },
  timelineFeasibility: { high: "Timeline looks workable", low: "Tight or slipped timeline" },
};

/**
 * Deterministic blend of pipeline signals — not a machine-learned classifier.
 * Example: ~78% with drivers "Strong financing posture", "Realistic vs list pricing"; risks "Inspection or condition risk".
 */
export function computeCloseProbability(ctx: CloseProbabilityContext): CloseProbabilityEngineResult {
  if (ctx.status === "cancelled") {
    const z: FactorRow = { score: 0.1, weight: 0, note: "Deal cancelled." };
    const factors = {
      buyerFinancingStrength: z,
      inspectionRisk: z,
      pricingAlignment: z,
      negotiationStability: z,
      sellerMotivation: z,
      documentCompleteness: z,
      timelineFeasibility: z,
    } as CloseProbabilityEngineResult["factors"];
    return {
      probability: 4,
      category: "LOW",
      drivers: [],
      risks: ["Deal cancelled — no close path."],
      factors,
    };
  }

  const dealAgeDays = daysBetween(ctx.dealCreatedAt, ctx.now);
  const factors: CloseProbabilityEngineResult["factors"] = {
    buyerFinancingStrength: scoreBuyerFinancing(ctx.status, ctx.hasBrokerExecutionApproval),
    inspectionRisk: scoreInspectionRisk(ctx.status, ctx.checklist.blocked, ctx.closingConditions.pending),
    pricingAlignment: scorePricingAlignment(ctx.listPriceGapPct),
    negotiationStability: scoreNegotiationStability(ctx.scoreInputs),
    sellerMotivation: scoreSellerMotivation(ctx.crmStage, dealAgeDays),
    documentCompleteness: scoreDocumentCompleteness(ctx.closingDocuments, ctx.dealDocumentsCount),
    timelineFeasibility: scoreTimeline(ctx.targetClosingDate, ctx.now, ctx.checklist.blocked, ctx.status),
  };

  let weighted = 0;
  let wsum = 0;
  for (const k of Object.keys(WEIGHTS) as CloseProbabilityFactorKey[]) {
    weighted += factors[k].score * factors[k].weight;
    wsum += factors[k].weight;
  }
  const blend = wsum > 0 ? weighted / wsum : 0.5;

  const stage = mapStatusToIntelligenceStage(ctx.status);
  const prior = stageClosePrior(stage);
  const mixed = clamp(0.52 * blend + 0.48 * prior, 0.06, 0.92);

  const stalePenalty = clamp((ctx.daysSinceLastActivity - 18) * 0.006, 0, 0.18);
  const adjusted = clamp(mixed - stalePenalty, 0.05, 0.94);
  const probability = Math.round(adjusted * 1000) / 10;

  const drivers: string[] = [];
  const risks: string[] = [];
  for (const k of Object.keys(factors) as CloseProbabilityFactorKey[]) {
    const f = factors[k];
    if (f.score >= 0.72) drivers.push(DRIVER_LABELS[k].high);
    if (f.score < 0.45) risks.push(DRIVER_LABELS[k].low);
  }
  if (ctx.daysSinceLastActivity > 14) {
    risks.push(`Limited recent activity (${Math.round(ctx.daysSinceLastActivity)}d since last touch).`);
  }

  const category = categoryFromProbability(probability);

  return {
    probability,
    category,
    drivers: drivers.slice(0, 5),
    risks: risks.slice(0, 6),
    factors,
  };
}
