import type { DealAnalyzerListingInput } from "@/modules/deal-analyzer/domain/types";

function clamp(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** Price positioning vs internal $/sqft benchmark (deterministic; not MLS). */
export function scorePricePositioning(input: DealAnalyzerListingInput): number {
  if (input.priceCents <= 0 || !input.surfaceSqft || input.surfaceSqft < 50) return 0;
  const ppsf = (input.priceCents / 100) / input.surfaceSqft;
  const t = (input.propertyType ?? "").toUpperCase();
  const threshold = t.includes("CONDO") ? 320 : t.includes("TOWN") ? 280 : t.includes("MULTI") ? 220 : 260;
  const pctVs = ((threshold - ppsf) / threshold) * 100;
  if (pctVs >= 15) return 100;
  if (pctVs >= 5) return 80;
  if (pctVs >= -5) return 60;
  if (pctVs >= -15) return 40;
  return 10;
}

/** Cash flow — maps income scenario strength (0–100 proxy) to table. */
export function scoreCashFlow(incomeComponent: number | null): number {
  if (incomeComponent == null) return 50;
  if (incomeComponent >= 72) return 100;
  if (incomeComponent >= 55) return 75;
  if (incomeComponent >= 45) return 50;
  if (incomeComponent >= 28) return 20;
  return 0;
}

/** ROI / cap — from illustrative annual ROI % when present, else neutral. */
export function scoreRoiQuality(annualRoiPercent: number | null | undefined): number {
  if (annualRoiPercent == null || Number.isNaN(annualRoiPercent)) return 40;
  const r = annualRoiPercent;
  if (r >= 10) return 100;
  if (r >= 6) return 80;
  if (r >= 3) return 60;
  if (r >= 1) return 40;
  return 10;
}

/** Demand — from market liquidity proxy (0–100). */
export function scoreDemandStrength(marketComponent: number): number {
  if (marketComponent >= 70) return 100;
  if (marketComponent >= 55) return 75;
  if (marketComponent >= 40) return 40;
  return 20;
}

/** Readiness — derived from final TrustScore (0–100). */
export function scoreReadinessFromTrust(trustScore: number | null | undefined): number {
  const t = trustScore ?? 0;
  if (t > 80) return 100;
  if (t >= 60) return 75;
  if (t >= 40) return 50;
  return 20;
}

/** Map platform riskScore (0–100) to risk level value for deduction term. */
export function riskLevelValueFromRiskScore(riskScore: number): number {
  if (riskScore < 35) return 10;
  if (riskScore < 55) return 30;
  if (riskScore < 75) return 60;
  return 80;
}

export function dealScoreRawWeighted(components: {
  pricePositioning: number;
  cashFlowPotential: number;
  roiQuality: number;
  demandStrength: number;
  readinessStrength: number;
}): number {
  const s =
    0.3 * components.pricePositioning +
    0.2 * components.cashFlowPotential +
    0.2 * components.roiQuality +
    0.15 * components.demandStrength +
    0.15 * components.readinessStrength;
  return clamp(s);
}
