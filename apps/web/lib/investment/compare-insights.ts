import { effectiveMonthlyCashFlowForDeal } from "@/lib/investment/rental-strategy-compare";

/** Minimal fields for comparison math (Prisma model satisfies this). */
export type DealComparable = {
  id: string;
  roi: number;
  riskScore: number;
  monthlyRent: number;
  monthlyExpenses: number;
  propertyPrice: number;
  nightlyRate?: number | null;
  occupancyRate?: number | null;
  preferredStrategy?: string | null;
  rentalType?: string | null;
  roiLongTerm?: number | null;
  roiShortTerm?: number | null;
};

function cashFlowInput(d: DealComparable) {
  return {
    monthlyRent: d.monthlyRent,
    monthlyExpenses: d.monthlyExpenses,
    nightlyRate: d.nightlyRate ?? null,
    occupancyRate: d.occupancyRate ?? null,
    preferredStrategy: d.preferredStrategy ?? null,
    rentalType: d.rentalType ?? null,
    roiLongTerm: d.roiLongTerm ?? null,
    roiShortTerm: d.roiShortTerm ?? null,
  };
}

export type CompareHighlights = {
  bestRoiId: string | null;
  bestMonthlyCfId: string | null;
  lowestRiskId: string | null;
};

export function dealShortLabel(index: number): string {
  return `Deal ${index + 1}`;
}

/** Among a subset of deals, mark best ROI, best monthly cash flow, lowest risk (for green cells). */
export function computeCompareHighlights(deals: DealComparable[]): CompareHighlights {
  if (deals.length === 0) {
    return { bestRoiId: null, bestMonthlyCfId: null, lowestRiskId: null };
  }
  let bestRoi = deals[0]!;
  let bestCf = deals[0]!;
  let lowestRisk = deals[0]!;
  for (const d of deals) {
    const cf = effectiveMonthlyCashFlowForDeal(cashFlowInput(d));
    const bestCfVal = effectiveMonthlyCashFlowForDeal(cashFlowInput(bestCf));
    if (d.roi > bestRoi.roi) bestRoi = d;
    if (cf > bestCfVal) bestCf = d;
    if (d.riskScore < lowestRisk.riskScore) lowestRisk = d;
  }
  return { bestRoiId: bestRoi.id, bestMonthlyCfId: bestCf.id, lowestRiskId: lowestRisk.id };
}

/**
 * Single “Best Investment” pick: balances yield, cash flow, and risk (deterministic).
 */
export function pickBestInvestmentDealId(deals: DealComparable[]): string | null {
  if (deals.length === 0) return null;
  const scored = deals.map((d) => {
    const cf = d.monthlyRent - d.monthlyExpenses;
    const score = d.roi * 2.2 - d.riskScore * 0.18 + cf / 250;
    return { id: d.id, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]!.id;
}

export function monthlyCashFlowForDeal(d: DealComparable): number {
  return effectiveMonthlyCashFlowForDeal(cashFlowInput(d));
}

/** 2–4 quick insight lines for the selected set. */
export function buildCompareInsightLines(deals: DealComparable[]): string[] {
  if (deals.length < 2) return [];
  const h = computeCompareHighlights(deals);
  const bestInv = pickBestInvestmentDealId(deals);
  const label = (id: string | null) => {
    if (!id) return "";
    const i = deals.findIndex((x) => x.id === id);
    return i >= 0 ? dealShortLabel(i) : "";
  };

  const lines: string[] = [];

  if (h.bestRoiId && h.lowestRiskId && h.bestRoiId !== h.lowestRiskId) {
    lines.push(
      `${label(h.bestRoiId)} has the highest ROI; ${label(h.lowestRiskId)} has the lowest risk score among your picks.`
    );
  } else if (h.bestRoiId) {
    lines.push(`${label(h.bestRoiId)} leads on ROI in this comparison.`);
  }

  if (h.bestMonthlyCfId && h.bestRoiId && h.bestMonthlyCfId !== h.bestRoiId) {
    lines.push(
      `${label(h.bestMonthlyCfId)} offers the strongest monthly cash flow, while ${label(h.bestRoiId)} leads on ROI.`
    );
  } else if (h.bestMonthlyCfId) {
    lines.push(`${label(h.bestMonthlyCfId)} shows the best monthly cash flow in this set.`);
  }

  if (bestInv) {
    lines.push(
      `“Best Investment” weights ROI, cash flow, and risk — currently ${label(bestInv)} (informational only, not advice).`
    );
  }

  return lines.slice(0, 4);
}
