import type { InvestorBuyBox } from "@prisma/client";

export type BuyBoxDealView = {
  listingId: string;
  city?: string | null;
  propertyType?: string | null;
  askingPriceCents?: number | null;
  capRate?: number | null;
  roiPercent?: number | null;
  cashflowCents?: number | null;
  dscr?: number | null;
  riskScore?: number | null;
  investmentZone?: string | null;
  neighborhoodName?: string | null;
};

export type BuyBoxScoreResult = {
  matchScore: number;
  matchLabel: string;
  reasons: string[];
};

type ScoreInput = {
  buyBox: InvestorBuyBox;
  deal: BuyBoxDealView;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function preferredHoods(buyBox: InvestorBuyBox): string[] {
  const raw = buyBox.preferredNeighborhoods;
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string");
  }
  return [];
}

export function computeBuyBoxMatchScore(input: ScoreInput): BuyBoxScoreResult {
  const { buyBox, deal } = input;

  let score = 0;
  const reasons: string[] = [];

  if (buyBox.city?.trim() && deal.city && deal.city.toLowerCase() === buyBox.city.trim().toLowerCase()) {
    score += 12;
    reasons.push("City matches buy box.");
  }

  if (
    buyBox.propertyType?.trim() &&
    deal.propertyType &&
    deal.propertyType === buyBox.propertyType.trim()
  ) {
    score += 10;
    reasons.push("Property type matches.");
  }

  if (
    typeof buyBox.minPriceCents === "number" &&
    typeof buyBox.maxPriceCents === "number" &&
    typeof deal.askingPriceCents === "number" &&
    deal.askingPriceCents >= buyBox.minPriceCents &&
    deal.askingPriceCents <= buyBox.maxPriceCents
  ) {
    score += 12;
    reasons.push("Price is inside target range.");
  }

  if (typeof buyBox.minCapRate === "number" && typeof deal.capRate === "number" && deal.capRate >= buyBox.minCapRate) {
    score += 15;
    reasons.push("Cap rate meets threshold (model-derived where full underwriting is absent).");
  }

  if (typeof buyBox.minROI === "number" && typeof deal.roiPercent === "number" && deal.roiPercent >= buyBox.minROI) {
    score += 12;
    reasons.push("ROI proxy meets threshold (model-derived where full underwriting is absent).");
  }

  if (
    typeof buyBox.minCashflowCents === "number" &&
    typeof deal.cashflowCents === "number" &&
    deal.cashflowCents >= buyBox.minCashflowCents
  ) {
    score += 15;
    reasons.push("Cashflow meets target.");
  }

  if (typeof buyBox.minDSCR === "number" && typeof deal.dscr === "number" && deal.dscr >= buyBox.minDSCR) {
    score += 10;
    reasons.push("DSCR meets target.");
  }

  if (
    typeof buyBox.maxRiskScore === "number" &&
    typeof deal.riskScore === "number" &&
    deal.riskScore <= buyBox.maxRiskScore
  ) {
    score += 8;
    reasons.push("Risk proxy is inside allowed range.");
  }

  if (
    buyBox.requiredZone?.trim() &&
    deal.investmentZone &&
    deal.investmentZone === buyBox.requiredZone.trim()
  ) {
    score += 8;
    reasons.push("Investment zone matches strategy.");
  }

  const hoods = preferredHoods(buyBox);
  if (hoods.length > 0 && deal.neighborhoodName && hoods.includes(deal.neighborhoodName)) {
    score += 8;
    reasons.push("Neighborhood is preferred.");
  }

  const finalScore = clamp(score);

  let matchLabel = "possible";
  if (finalScore >= 80) matchLabel = "excellent";
  else if (finalScore >= 60) matchLabel = "strong";

  return {
    matchScore: finalScore,
    matchLabel,
    reasons,
  };
}

/** Map FSBO listing + metrics into scoring inputs (illustrative cap/ROI when underwriting fields are missing). */
export function dealViewFromFsbo(
  listing: {
    id: string;
    city: string;
    propertyType: string | null;
    priceCents: number;
    region: string | null;
  },
  metrics: { dealScore: number; trustScore: number } | null,
): BuyBoxDealView {
  const dealScore = metrics?.dealScore ?? 0;
  const trust = metrics?.trustScore ?? 50;
  return {
    listingId: listing.id,
    city: listing.city,
    propertyType: listing.propertyType,
    askingPriceCents: listing.priceCents,
    capRate: dealScore > 0 ? (dealScore / 100) * 0.08 : null,
    roiPercent: dealScore > 0 ? (dealScore / 100) * 0.12 : null,
    cashflowCents: null,
    dscr: null,
    riskScore: Math.max(0, Math.min(100, 100 - trust)),
    investmentZone: listing.region?.toLowerCase() ?? null,
    neighborhoodName: listing.city,
  };
}
