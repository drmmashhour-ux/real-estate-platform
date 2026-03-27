/**
 * Deterministic investment insights (no external AI).
 * riskScore: 0 = lowest risk, 100 = highest risk.
 */

export type InvestmentRating = "Strong Buy" | "Moderate Investment" | "High Risk";

export type InsightTone = "success" | "warning" | "danger";

/** Tailwind-friendly classes for rating / risk bands. */
export function getInsightTone(rating: InvestmentRating): InsightTone {
  switch (rating) {
    case "Strong Buy":
      return "success";
    case "Moderate Investment":
      return "warning";
    default:
      return "danger";
  }
}

export function getRiskScoreTone(riskScore: number): InsightTone {
  if (riskScore <= 40) return "success";
  if (riskScore <= 65) return "warning";
  return "danger";
}

/** Map persisted rating string to tone (for dashboard rows). */
export function getInsightToneFromString(rating: string): InsightTone {
  if (rating === "Strong Buy") return "success";
  if (rating === "Moderate Investment") return "warning";
  return "danger";
}

export function insightPillClass(tone: InsightTone): string {
  switch (tone) {
    case "success":
      return "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#C9A646]/15 text-[#E8D5A3] ring-1 ring-[#C9A646]/40 shadow-[0_1px_8px_rgba(201,166,70,0.12)]";
    case "warning":
      return "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40";
    case "danger":
      return "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-500/20 text-red-200 ring-1 ring-red-500/40";
  }
}

/**
 * Investment rating from ROI bands, refined by monthly cash flow.
 * - ROI > 10% → Strong Buy (if CF ≥ 0; else Moderate)
 * - ROI 5–10% → Moderate Investment (if CF ≥ 0; if CF < 0 → High Risk)
 * - ROI < 5% → High Risk
 */
export function computeRating(roi: number, monthlyCashFlow: number): InvestmentRating {
  if (monthlyCashFlow < 0) {
    if (roi > 10) return "Moderate Investment";
    if (roi >= 5) return "Moderate Investment";
    return "High Risk";
  }
  if (roi > 10) return "Strong Buy";
  if (roi >= 5) return "Moderate Investment";
  return "High Risk";
}

/**
 * Risk score 0–100 (higher = riskier), from ROI and monthly cash flow.
 */
export function computeRiskScore(roi: number, monthlyCashFlow: number): number {
  let s: number;
  if (roi > 10) {
    s = 28 - Math.min(18, (roi - 10) * 1.8);
  } else if (roi >= 5) {
    s = 48 + (10 - roi) * 2.4;
  } else {
    s = 72 + (5 - roi) * 5.6;
  }
  if (monthlyCashFlow < 0) {
    s += 22;
  } else if (monthlyCashFlow < 300) {
    s += 8;
  } else if (monthlyCashFlow < 800) {
    s += 3;
  }
  return Math.round(Math.max(0, Math.min(100, s)));
}

export function computeInvestmentInsights(roi: number, monthlyCashFlow: number) {
  const riskScore = computeRiskScore(roi, monthlyCashFlow);
  const rating = computeRating(roi, monthlyCashFlow);
  return { riskScore, rating };
}
