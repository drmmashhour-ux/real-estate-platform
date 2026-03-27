/**
 * Explainable portfolio planning — estimates only, not financial advice.
 */

import { computeRoi, type RoiOutputs } from "@/lib/invest/roi";
import { analyzeDeal, type DealAnalyzeResult } from "@/lib/ai/deal-analyzer";
import { buildMarketAnalysis } from "@/lib/market/analysis-service";
import { welcomeTaxForPriceCents } from "@/lib/compare/welcome-slug";
import type { PrismaClient } from "@prisma/client";

import { PORTFOLIO_DISCLAIMER_TEXT } from "@/lib/invest/portfolio-disclaimer";
import type { InvestorProfileInput } from "@/lib/invest/portfolio-types";

export const PORTFOLIO_DISCLAIMER = PORTFOLIO_DISCLAIMER_TEXT;

export type { InvestorProfileInput };

export type PortfolioListing = {
  id: string;
  title: string;
  city: string;
  priceCents: number;
  bedrooms: number | null;
  bathrooms: number | null;
  surfaceSqft: number | null;
  coverImage: string | null;
  images: string[];
};

export type EnrichedListing = {
  listing: PortfolioListing;
  roi: RoiOutputs;
  deal: DealAnalyzeResult;
  marketTrend: "rising" | "stable" | "declining";
  marketScore: number;
  fitScore: number;
  strengths: string[];
  risks: string[];
  whyRecommended: string;
  estimatedRentCents: number;
};

export type PortfolioScenarioKind = "conservative" | "balanced" | "aggressive";

export type PortfolioSummaryResult = {
  propertyCount: number;
  totalPurchaseCents: number;
  totalDownCents: number;
  avgRoi: number;
  avgCap: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  riskLevel: "low" | "medium" | "high";
};

export type DiversificationAnalysisResult = {
  score: number;
  cityBreakdown: Record<string, number>;
  notes: string[];
};

export type PortfolioScenarioPreview = {
  kind: PortfolioScenarioKind;
  title: string;
  items: EnrichedListing[];
  summary: PortfolioSummaryResult;
  diversification: DiversificationAnalysisResult;
  insights: { strengths: string[]; risks: string[]; opportunities: string[] };
};

export type PortfolioBuildResult = {
  label: "estimate";
  recommended: EnrichedListing[];
  scenarios: PortfolioScenarioPreview[];
  disclaimer: string;
};

function normCity(c: string) {
  return c.trim().toLowerCase();
}

function cityMatches(profile: InvestorProfileInput, city: string): number {
  if (!profile.targetCities?.length) return 0.6;
  const n = normCity(city);
  const hit = profile.targetCities.some((t) => n.includes(normCity(t)) || normCity(t).includes(n));
  return hit ? 1 : 0.35;
}

function riskRank(r: string): number {
  if (r === "low") return 0;
  if (r === "high") return 2;
  return 1;
}

/** Investor-fit score 0–100 — rule-based weights by strategy & profile. */
export function scoreListingForInvestor(
  profile: InvestorProfileInput,
  listing: PortfolioListing,
  roi: RoiOutputs,
  deal: DealAnalyzeResult,
  marketTrend: "rising" | "stable" | "declining",
  marketScore: number
): { fitScore: number; strengths: string[]; risks: string[]; whyRecommended: string } {
  const strengths: string[] = [];
  const risks: string[] = [];
  const strat = profile.strategy ?? "balanced";
  const rt = profile.riskTolerance ?? "medium";

  const cf = roi.monthlyCashFlow;
  const cap = roi.capRatePercent;
  const roiP = roi.roiPercent;
  const cityW = cityMatches(profile, listing.city);

  if (cf > 0) strengths.push("Positive estimated monthly cash flow under default financing assumptions.");
  else risks.push("Negative or tight cash flow at illustrated rent and financing.");

  if (cap >= 5) strengths.push(`Cap rate (estimate) near ${cap.toFixed(1)}%.`);
  if (deal.riskLevel === "high") risks.push("Deal risk flags in the rule-based analyzer (estimate).");
  if (marketTrend === "rising") strengths.push("City trend analysis suggests upward price pressure (estimate).");
  if (marketTrend === "declining") risks.push("City trend analysis shows softening averages in our sample (estimate).");

  const trendN = marketTrend === "rising" ? 1 : marketTrend === "declining" ? 0 : 0.55;
  const cfN = Math.min(1, Math.max(0, (cf + 2000) / 4000));
  const capN = Math.min(1, Math.max(0, cap / 12));
  const roiN = Math.min(1, Math.max(0, roiP / 20));
  const dealN = deal.dealScore / 100;
  const riskPenalty = riskRank(deal.riskLevel) / 2;

  let fit = 0;
  if (strat === "cash_flow") {
    fit = cfN * 0.35 + capN * 0.25 + roiN * 0.15 + cityW * 0.15 + dealN * 0.1;
    if (rt === "low") fit -= riskPenalty * 0.08;
  } else if (strat === "appreciation") {
    fit = trendN * 0.35 + roiN * 0.25 + (marketScore / 100) * 0.2 + cityW * 0.1 + dealN * 0.1;
    if (rt === "high") fit += 0.05;
  } else {
    fit = cfN * 0.22 + capN * 0.18 + roiN * 0.2 + trendN * 0.15 + cityW * 0.15 + dealN * 0.1;
  }

  fit = Math.min(1, Math.max(0, fit));
  const fitScore = Math.round(fit * 100);

  let why =
    strat === "cash_flow"
      ? `Fits a cash-flow focus: estimated yield and monthly cash flow vs price, adjusted for your cities (estimate).`
      : strat === "appreciation"
        ? `Fits growth-oriented criteria: trend + ROI signals vs your horizon (estimate).`
        : `Balanced weighting of cash flow, cap rate, and market trend (estimate).`;

  return { fitScore, strengths, risks, whyRecommended: why };
}

export function calculatePortfolioSummary(items: EnrichedListing[]): PortfolioSummaryResult {
  if (items.length === 0) {
    return {
      propertyCount: 0,
      totalPurchaseCents: 0,
      totalDownCents: 0,
      avgRoi: 0,
      avgCap: 0,
      monthlyCashFlow: 0,
      annualCashFlow: 0,
      riskLevel: "low" as const,
    };
  }
  let totalPurchase = 0;
  let totalDown = 0;
  let sumRoi = 0;
  let sumCap = 0;
  let monthlyCf = 0;
  let riskScore = 0;
  for (const it of items) {
    const p = it.listing.priceCents;
    totalPurchase += p;
    const down = Math.min(p * 0.2, p);
    totalDown += down;
    sumRoi += it.roi.roiPercent;
    sumCap += it.roi.capRatePercent;
    monthlyCf += it.roi.monthlyCashFlow;
    riskScore += riskRank(it.deal.riskLevel);
  }
  const n = items.length;
  const avgRoi = sumRoi / n;
  const avgCap = sumCap / n;
  const avgRisk = riskScore / n;
  const riskLevel = avgRisk < 0.8 ? "low" : avgRisk < 1.5 ? "medium" : "high";
  return {
    propertyCount: n,
    totalPurchaseCents: totalPurchase,
    totalDownCents: totalDown,
    avgRoi,
    avgCap,
    monthlyCashFlow: monthlyCf,
    annualCashFlow: monthlyCf * 12,
    riskLevel: riskLevel as "low" | "medium" | "high",
  };
}

export function calculateDiversificationScore(items: EnrichedListing[]): number {
  if (items.length <= 1) return items.length === 1 ? 35 : 0;
  const cities = new Map<string, number>();
  for (const it of items) {
    const c = normCity(it.listing.city);
    cities.set(c, (cities.get(c) ?? 0) + 1);
  }
  const n = items.length;
  let hhi = 0;
  for (const v of cities.values()) {
    const s = v / n;
    hhi += s * s;
  }
  return Math.round((1 - hhi) * 100);
}

export function calculateDiversificationAnalysis(items: EnrichedListing[]): DiversificationAnalysisResult {
  const cities = new Map<string, number>();
  const types = new Map<string, number>();
  const risks = new Map<string, number>();
  for (const it of items) {
    const c = it.listing.city;
    cities.set(c, (cities.get(c) ?? 0) + 1);
    types.set("Residential", (types.get("Residential") ?? 0) + 1);
    risks.set(it.deal.riskLevel, (risks.get(it.deal.riskLevel) ?? 0) + 1);
  }
  const score = calculateDiversificationScore(items);
  const notes: string[] = [];
  const topCity = [...cities.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCity && topCity[1] >= items.length && items.length > 1) {
    notes.push(`Your portfolio is heavily concentrated in ${topCity[0]} (illustrative mix).`);
  }
  if (cities.size === 1 && items.length > 1) {
    notes.push(`All selected properties are in one city — diversification across municipalities may reduce concentration risk.`);
  }
  const highR = risks.get("high") ?? 0;
  if (highR === items.length && items.length > 0) {
    notes.push(`All selected properties show higher risk flags in the estimate — review assumptions.`);
  }
  return { score, cityBreakdown: Object.fromEntries(cities), notes };
}

function buildInsights(profile: InvestorProfileInput, summary: PortfolioSummaryResult, div: DiversificationAnalysisResult) {
  const strengths: string[] = [];
  const risks: string[] = [];
  const opportunities: string[] = [];
  const strat = profile.strategy ?? "balanced";

  strengths.push(
    `This mix aligns with a ${strat.replace("_", " ")}-leaning plan on paper — verify financing and rent with professionals.`
  );
  if (summary.monthlyCashFlow > 0) strengths.push("Aggregate monthly cash flow is positive under illustrated assumptions (estimate).");
  else risks.push("Aggregate monthly cash flow is weak or negative at default assumptions — stress-test rent and rate.");

  if (div.score >= 60) strengths.push("Diversification score suggests some spread across locations (estimate).");
  else opportunities.push("Adding another municipality or property type could improve diversification (illustrative).");

  if (profile.budgetCents && summary.totalPurchaseCents <= profile.budgetCents) {
    strengths.push("Total purchase is within the stated budget envelope (planning tool).");
  } else if (profile.budgetCents) {
    risks.push("Selected properties may exceed the stated budget — adjust selection or assumptions.");
  }

  return { strengths, risks, opportunities };
}

async function enrichListing(
  prisma: PrismaClient,
  listing: PortfolioListing,
  profile: InvestorProfileInput
): Promise<EnrichedListing | null> {
  const price = listing.priceCents / 100;
  if (price <= 0) return null;

  const budget = profile.budgetCents != null ? profile.budgetCents / 100 : null;
  if (budget != null && listing.priceCents > profile.budgetCents!) return null;

  const downBudget = profile.downPaymentCents != null ? profile.downPaymentCents / 100 : null;
  const down = Math.min(
    downBudget != null ? Math.min(downBudget, price * 0.25) : price * 0.2,
    price * 0.25
  );

  const wt = await welcomeTaxForPriceCents(prisma, listing.city, listing.priceCents, "first_time");
  const rent = Math.max(100, Math.round(price * 0.004));

  const roiInputs = {
    purchasePrice: price,
    downPayment: down,
    mortgageInterestRate: 5.49,
    amortizationYears: 25,
    monthlyRent: rent,
    vacancyRatePercent: 5,
    propertyTaxAnnual: price * 0.012,
    condoFeesAnnual: 0,
    insuranceAnnual: 1200,
    managementAnnual: 0,
    repairsReserveAnnual: price * 0.01,
    closingCosts: 7500,
    welcomeTax: wt.welcomeTaxCents / 100,
    otherMonthlyExpenses: 0,
    otherAnnualExpenses: 0,
  };
  const roi = computeRoi(roiInputs);

  const deal = analyzeDeal({
    purchasePrice: price,
    rentEstimate: rent,
    propertyTaxAnnual: roiInputs.propertyTaxAnnual,
    condoFeesAnnual: 0,
    insuranceAnnual: 1200,
    managementAnnual: 0,
    repairsReserveAnnual: roiInputs.repairsReserveAnnual,
    otherAnnualExpenses: 0,
    otherMonthlyExpenses: 0,
    interestRate: 5.49,
    downPayment: down,
    amortizationYears: 25,
    vacancyRatePercent: 5,
    closingCosts: 7500,
    welcomeTax: wt.welcomeTaxCents / 100,
    locationCity: listing.city,
    propertyType: "Residential",
    mode: "investor",
    buyerFeatureScore: Math.min(
      1,
      ((listing.bedrooms ?? 0) + (listing.bathrooms ?? 0) * 0.5 + (listing.surfaceSqft ?? 0) / 800) / 8
    ),
  });

  let marketTrend: "rising" | "stable" | "declining" = "stable";
  let marketScore = 50;
  try {
    const ma = await buildMarketAnalysis(listing.city, "Residential");
    marketTrend = ma.trend.trend;
    marketScore = ma.marketScore;
  } catch {
    /* no market data */
  }

  const scored = scoreListingForInvestor(profile, listing, roi, deal, marketTrend, marketScore);

  return {
    listing,
    roi,
    deal,
    marketTrend,
    marketScore,
    fitScore: scored.fitScore,
    strengths: scored.strengths,
    risks: scored.risks,
    whyRecommended: scored.whyRecommended,
    estimatedRentCents: rent * 100,
  };
}

function sortForKind(
  kind: PortfolioScenarioKind,
  enriched: EnrichedListing[],
  profile: InvestorProfileInput
): EnrichedListing[] {
  const copy = [...enriched];
  if (kind === "conservative") {
    return copy
      .filter((e) => e.deal.riskLevel !== "high" && e.fitScore >= 45)
      .sort((a, b) => b.fitScore - a.fitScore);
  }
  if (kind === "aggressive") {
    return copy.sort((a, b) => b.roi.roiPercent - a.roi.roiPercent);
  }
  return copy.sort((a, b) => b.fitScore - a.fitScore);
}

function greedyPack(
  ordered: EnrichedListing[],
  profile: InvestorProfileInput,
  maxProps: number
): EnrichedListing[] {
  const budget = profile.budgetCents ?? Number.MAX_SAFE_INTEGER;
  let remaining = budget;
  const out: EnrichedListing[] = [];
  for (const e of ordered) {
    if (out.length >= maxProps) break;
    const p = e.listing.priceCents;
    if (p <= remaining) {
      out.push(e);
      remaining -= p;
    }
  }
  return out;
}

export async function buildPortfolio(
  prisma: PrismaClient,
  profile: InvestorProfileInput,
  listings: PortfolioListing[]
): Promise<PortfolioBuildResult> {
  const enriched: EnrichedListing[] = [];
  for (const l of listings.slice(0, 40)) {
    const e = await enrichListing(prisma, l, profile);
    if (e) enriched.push(e);
  }
  enriched.sort((a, b) => b.fitScore - a.fitScore);

  const recommended = enriched.slice(0, 12);

  const kinds: PortfolioScenarioKind[] = ["conservative", "balanced", "aggressive"];
  const scenarios: PortfolioScenarioPreview[] = kinds.map((kind) => {
    const ordered = sortForKind(kind, enriched, profile);
    const packed = greedyPack(ordered, profile, 4);
    const summary = calculatePortfolioSummary(packed);
    const diversification = calculateDiversificationAnalysis(packed);
    const insights = buildInsights(profile, summary, diversification);
    const titles: Record<PortfolioScenarioKind, string> = {
      conservative: "Conservative portfolio (estimate)",
      balanced: "Balanced portfolio (estimate)",
      aggressive: "Aggressive portfolio (estimate)",
    };
    return {
      kind,
      title: titles[kind],
      items: packed,
      summary,
      diversification,
      insights,
    };
  });

  return {
    label: "estimate",
    recommended,
    scenarios,
    disclaimer: PORTFOLIO_DISCLAIMER,
  };
}

export async function fetchFsboListingsForPortfolio(prisma: PrismaClient, take = 48): Promise<PortfolioListing[]> {
  const rows = await prisma.fsboListing.findMany({
    where: { status: "ACTIVE", moderationStatus: "APPROVED" },
    take,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      city: true,
      priceCents: true,
      bedrooms: true,
      bathrooms: true,
      surfaceSqft: true,
      coverImage: true,
      images: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    city: r.city,
    priceCents: r.priceCents,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    surfaceSqft: r.surfaceSqft,
    coverImage: r.coverImage,
    images: r.images,
  }));
}
