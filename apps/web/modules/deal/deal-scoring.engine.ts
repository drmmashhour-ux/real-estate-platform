export type DealScoreCategory = "EXCELLENT" | "GOOD" | "RISKY" | "REJECT";
export type DealScoreRiskBand = "LOW" | "MEDIUM" | "HIGH";
export type DealScoreRecommendation = "ACCEPT" | "REVIEW" | "REJECT";

export type DealScoringContext = {
  dealPriceCad: number;
  listPriceCad: number | null;
  listVsMarketPct: number | null;
  city: string | null;
  listingRankingScore: number | null;
  conditionLabel: string | null;
  knownIssuesPresent: boolean;
  financingStrength: "weak" | "moderate" | "strong";
  inspectionStress: "low" | "medium" | "high";
  pendingClosingConditions: number;
  daysSinceLastActivity: number;
  rejectedNegotiationCount: number;
  esgComposite: number | null;
  investorImpliedYieldPct: number | null;
  isInvestmentDeal: boolean;
  dealStatus: string;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function scorePriceVsMarket(listVsMarketPct: number | null, dealPriceCad: number, listPriceCad: number | null): number {
  if (listPriceCad == null || listPriceCad <= 0) return 62;
  const gapPct = (Math.abs(dealPriceCad - listPriceCad) / listPriceCad) * 100;
  let s = 72;
  if (gapPct <= 2) s = 92;
  else if (gapPct <= 5) s = 85;
  else if (gapPct <= 9) s = 74;
  else if (gapPct <= 14) s = 58;
  else s = 42;
  if (listVsMarketPct != null) {
    if (listVsMarketPct < -5) s += 6;
    if (listVsMarketPct > 8) s -= 10;
  }
  return clamp(s, 18, 98);
}

function scoreLocation(city: string | null, listingRankingScore: number | null): number {
  let s = 65;
  const c = (city ?? "").toLowerCase();
  if (c.includes("montreal") || c.includes("toronto") || c.includes("vancouver")) s += 12;
  if (c.includes("laval") || c.includes("calgary") || c.includes("ottawa")) s += 6;
  if (listingRankingScore != null && listingRankingScore > 0) {
    s += clamp((listingRankingScore / 100) * 18, 0, 18);
  }
  return clamp(s, 35, 96);
}

function scoreCondition(conditionLabel: string | null, knownIssues: boolean): number {
  const t = (conditionLabel ?? "").toLowerCase();
  let s = 70;
  if (t.includes("excellent") || t.includes("new")) s = 88;
  else if (t.includes("good") || t.includes("well")) s = 78;
  else if (t.includes("fair") || t.includes("average")) s = 62;
  else if (t.includes("poor") || t.includes("major")) s = 38;
  if (knownIssues) s -= 12;
  return clamp(s, 22, 95);
}

function scoreFinancing(strength: DealScoringContext["financingStrength"]): number {
  switch (strength) {
    case "strong":
      return 88;
    case "moderate":
      return 68;
    default:
      return 48;
  }
}

function scoreInspection(stress: DealScoringContext["inspectionStress"]): number {
  switch (stress) {
    case "low":
      return 82;
    case "medium":
      return 62;
    default:
      return 44;
  }
}

function scoreTimeToClose(daysIdle: number, pendingConditions: number): number {
  let s = 74;
  s -= clamp(daysIdle * 0.9, 0, 22);
  s -= Math.min(18, pendingConditions * 4);
  return clamp(s, 25, 94);
}

function scoreEsg(composite: number | null): number {
  if (composite == null) return 58;
  return clamp(composite, 30, 98);
}

function scoreInvestorReturn(yieldPct: number | null, isInvestment: boolean): number {
  if (!isInvestment || yieldPct == null) return 60;
  if (yieldPct >= 10) return 88;
  if (yieldPct >= 6) return 74;
  if (yieldPct >= 3) return 58;
  return 42;
}

export function categoryFromScore(score: number, risk: DealScoreRiskBand): DealScoreCategory {
  if (score < 36) return "REJECT";
  if (risk === "HIGH" && score < 58) return "REJECT";
  if (risk === "HIGH") return "RISKY";
  if (score < 52) return "RISKY";
  if (score < 76) return "GOOD";
  return "EXCELLENT";
}

export function recommendationFrom(category: DealScoreCategory, risk: DealScoreRiskBand): DealScoreRecommendation {
  if (category === "REJECT" || risk === "HIGH") return "REJECT";
  if (category === "RISKY" || risk === "MEDIUM") return "REVIEW";
  if (category === "GOOD") return risk === "LOW" ? "ACCEPT" : "REVIEW";
  return "ACCEPT";
}

export type DealScoringEngineResult = {
  score: number;
  category: DealScoreCategory;
  riskLevel: DealScoreRiskBand;
  strengths: string[];
  risks: string[];
  recommendation: DealScoreRecommendation;
  factors: Record<string, number>;
};

/**
 * Deterministic broker-assist scoring — not an automated underwriting or suitability decision.
 */
export function computeDealScoring(ctx: DealScoringContext): DealScoringEngineResult {
  if (ctx.dealStatus === "cancelled") {
    return {
      score: 8,
      category: "REJECT",
      riskLevel: "HIGH",
      strengths: [],
      risks: ["Deal cancelled — no actionable file."],
      recommendation: "REJECT",
      factors: {},
    };
  }

  const factors: Record<string, number> = {
    priceVsMarket: scorePriceVsMarket(ctx.listVsMarketPct, ctx.dealPriceCad, ctx.listPriceCad),
    locationQuality: scoreLocation(ctx.city, ctx.listingRankingScore),
    propertyCondition: scoreCondition(ctx.conditionLabel, ctx.knownIssuesPresent),
    financingStrength: scoreFinancing(ctx.financingStrength),
    inspectionRisk: scoreInspection(ctx.inspectionStress),
    timeToClose: scoreTimeToClose(ctx.daysSinceLastActivity, ctx.pendingClosingConditions),
    esg: scoreEsg(ctx.esgComposite),
    investorReturn: scoreInvestorReturn(ctx.investorImpliedYieldPct, ctx.isInvestmentDeal),
  };

  const weights: Record<string, number> = {
    priceVsMarket: 0.22,
    locationQuality: 0.12,
    propertyCondition: 0.12,
    financingStrength: 0.14,
    inspectionRisk: 0.12,
    timeToClose: 0.1,
    esg: ctx.esgComposite != null ? 0.08 : 0.04,
    investorReturn: ctx.isInvestmentDeal ? 0.1 : 0.04,
  };

  let sumW = 0;
  let acc = 0;
  for (const k of Object.keys(weights)) {
    const w = weights[k]!;
    const v = factors[k] ?? 60;
    acc += v * w;
    sumW += w;
  }
  const score = Math.round((acc / Math.max(sumW, 0.0001)) * 10) / 10;

  let riskLevel: DealScoreRiskBand = "LOW";
  if (ctx.daysSinceLastActivity > 18 || ctx.rejectedNegotiationCount >= 3 || ctx.inspectionStress === "high") {
    riskLevel = "HIGH";
  } else if (
    ctx.daysSinceLastActivity > 9 ||
    ctx.rejectedNegotiationCount >= 1 ||
    ctx.inspectionStress === "medium" ||
    ctx.pendingClosingConditions > 2
  ) {
    riskLevel = "MEDIUM";
  }

  if (ctx.financingStrength === "weak" && ctx.dealStatus === "financing") {
    riskLevel = riskLevel === "LOW" ? "MEDIUM" : "HIGH";
  }

  const category = categoryFromScore(score, riskLevel);
  const recommendation = recommendationFrom(category, riskLevel);

  const strengths: string[] = [];
  const risks: string[] = [];

  if (factors.priceVsMarket >= 78) strengths.push("Pricing aligns well with list / market signals.");
  if (factors.priceVsMarket < 50) risks.push("Price vs market appears stretched — verify comps.");

  if (factors.locationQuality >= 78) strengths.push("Location signals are strong for the stated market.");
  if (factors.locationQuality < 55) risks.push("Location demand or ranking signals are soft.");

  if (factors.propertyCondition >= 78) strengths.push("Disclosed condition reads favorably.");
  if (factors.propertyCondition < 55 || ctx.knownIssuesPresent) risks.push("Condition or known-issue disclosure needs broker review.");

  if (factors.financingStrength >= 80) strengths.push("Financing posture looks firm for the current stage.");
  if (factors.financingStrength < 58) risks.push("Financing strength is uncertain — confirm lender status.");

  if (factors.inspectionRisk >= 75) strengths.push("Inspection / diligence lane looks manageable.");
  if (factors.inspectionRisk < 58) risks.push("Inspection or condition risk is elevated.");

  if (factors.timeToClose >= 72) strengths.push("Timeline and condition count suggest workable closing cadence.");
  if (factors.timeToClose < 55) risks.push("Idle time or pending conditions may threaten closing feasibility.");

  if (ctx.esgComposite != null && factors.esg >= 72) strengths.push("ESG profile adds a positive sustainability signal.");
  if (ctx.esgComposite != null && factors.esg < 50) risks.push("ESG scores are weak — flag for ESG-sensitive buyers.");

  if (ctx.isInvestmentDeal && factors.investorReturn >= 75) strengths.push("Implied investor return band looks attractive vs assumptions.");
  if (ctx.isInvestmentDeal && factors.investorReturn < 52) risks.push("Implied investor return is thin — stress-test rent and costs.");

  return {
    score: clamp(score, 5, 99),
    category,
    riskLevel,
    strengths: strengths.slice(0, 6),
    risks: risks.slice(0, 7),
    recommendation,
    factors,
  };
}
