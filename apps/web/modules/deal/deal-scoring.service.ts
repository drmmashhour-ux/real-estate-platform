import { prisma } from "@/lib/db";
import { buildScoreContext } from "./deal.service";
import {
  computeDealScoring,
  type DealScoringContext,
  type DealScoringEngineResult,
} from "./deal-scoring.engine";
import { resolveComparableMedian } from "./negotiation-strategy.service";

const MS_DAY = 86_400_000;

export const DEAL_SCORING_ADVISORY =
  "Assistive broker decision support only — not underwriting, suitability, or a substitute for professional diligence and brokerage judgment.";

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, (b.getTime() - a.getTime()) / MS_DAY);
}

type ListingMeta = {
  city: string | null;
  conditionLabel: string | null;
  knownIssuesPresent: boolean;
  listingRankingScore: number | null;
  investmentPurchase: number | null;
  investmentEstValue: number | null;
};

async function loadListingMeta(listingId: string | null): Promise<ListingMeta> {
  const empty: ListingMeta = {
    city: null,
    conditionLabel: null,
    knownIssuesPresent: false,
    listingRankingScore: null,
    investmentPurchase: null,
    investmentEstValue: null,
  };
  if (!listingId) return empty;

  const fsbo = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { city: true },
  });
  if (fsbo) {
    return { ...empty, city: fsbo.city };
  }

  const stay = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      city: true,
      conditionOfProperty: true,
      knownIssues: true,
      aiDiscoveryScore: true,
      investmentPurchasePriceMajor: true,
      investmentEstimatedValueMajor: true,
    },
  });
  if (stay) {
    const ki = (stay.knownIssues ?? "").trim();
    const knownIssuesPresent = ki.length > 0 && !/^none\.?$/i.test(ki);
    return {
      ...empty,
      city: stay.city,
      conditionLabel: stay.conditionOfProperty ?? null,
      knownIssuesPresent,
      listingRankingScore: stay.aiDiscoveryScore != null ? Number(stay.aiDiscoveryScore) : null,
      investmentPurchase: stay.investmentPurchasePriceMajor ?? null,
      investmentEstValue: stay.investmentEstimatedValueMajor ?? null,
    };
  }

  const [rank, esgListing] = await Promise.all([
    prisma.listingRankScore.findFirst({
      where: { listingId },
      orderBy: { createdAt: "desc" },
      select: { totalScore: true },
    }),
    prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true, titleFr: true },
    }),
  ]);

  let city: string | null = null;
  const blob = `${esgListing?.title ?? ""} ${esgListing?.titleFr ?? ""}`.toLowerCase();
  if (blob.includes("montréal") || blob.includes("montreal")) city = "Montreal";
  else if (blob.includes("toronto")) city = "Toronto";
  else if (blob.includes("vancouver")) city = "Vancouver";
  else if (blob.includes("laval")) city = "Laval";
  else if (blob.includes("calgary")) city = "Calgary";
  else if (blob.includes("ottawa")) city = "Ottawa";

  return {
    ...empty,
    city,
    listingRankingScore: rank?.totalScore != null ? Math.round(Number(rank.totalScore)) : null,
  };
}

async function buildDealScoringContext(dealId: string): Promise<DealScoringContext | null> {
  const scoreCtx = await buildScoreContext(dealId);
  if (!scoreCtx) return null;

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      status: true,
      listingId: true,
      dealExecutionType: true,
    },
  });
  if (!deal) return null;

  const { inputs } = scoreCtx;
  const now = inputs.now;

  const [
    approvalCount,
    conditionRows,
    meta,
    { median: comparableMedianCad },
    esgRow,
  ] = await Promise.all([
    prisma.dealExecutionApproval.count({ where: { dealId } }),
    prisma.dealClosingCondition.findMany({
      where: { dealId },
      select: { conditionType: true, status: true },
      take: 40,
    }),
    loadListingMeta(deal.listingId),
    resolveComparableMedian(deal.listingId),
    deal.listingId ?
      prisma.esgProfile.findUnique({
        where: { listingId: deal.listingId },
        select: { compositeScore: true },
      })
    : Promise.resolve(null),
  ]);

  let pendingClosingConditions = 0;
  for (const c of conditionRows) {
    const st = (c.status ?? "").toLowerCase();
    if (st === "fulfilled" || st === "waived" || st === "released") continue;
    pendingClosingConditions += 1;
  }

  let inspectionStress: DealScoringContext["inspectionStress"] = "low";
  if (deal.status === "inspection") inspectionStress = "high";
  else if (
    conditionRows.some((c) => {
      const t = c.conditionType ?? "";
      const st = (c.status ?? "").toLowerCase();
      return /inspect|inspection|survey/i.test(t) && st !== "fulfilled" && st !== "waived" && st !== "released";
    })
  ) {
    inspectionStress = "medium";
  }

  let financingStrength: DealScoringContext["financingStrength"] = "moderate";
  if (deal.status === "financing") financingStrength = "moderate";
  if (approvalCount > 0) financingStrength = "strong";
  if (deal.status === "initiated" || deal.status === "offer_submitted") financingStrength = "weak";

  const listPriceCad = inputs.listPriceCad;
  let listVsMarketPct: number | null = null;
  if (listPriceCad != null && listPriceCad > 0 && comparableMedianCad != null && comparableMedianCad > 0) {
    listVsMarketPct = ((listPriceCad - comparableMedianCad) / comparableMedianCad) * 100;
  }

  let investorImpliedYieldPct: number | null = null;
  if (meta.investmentPurchase != null && meta.investmentPurchase > 0 && meta.investmentEstValue != null) {
    investorImpliedYieldPct =
      ((meta.investmentEstValue - meta.investmentPurchase) / meta.investmentPurchase) * 100;
  }

  const isInvestmentDeal =
    deal.dealExecutionType === "income_property" ||
    meta.investmentPurchase != null ||
    meta.investmentEstValue != null;

  const esgComposite = esgRow?.compositeScore != null && Number.isFinite(Number(esgRow.compositeScore)) ?
      Number(esgRow.compositeScore)
    : null;

  return {
    dealPriceCad: inputs.dealPriceCad,
    listPriceCad,
    listVsMarketPct,
    city: meta.city,
    listingRankingScore: meta.listingRankingScore,
    conditionLabel: meta.conditionLabel,
    knownIssuesPresent: meta.knownIssuesPresent,
    financingStrength,
    inspectionStress,
    pendingClosingConditions,
    daysSinceLastActivity: daysBetween(inputs.lastActivityAt, now),
    rejectedNegotiationCount: inputs.rejectedProposals,
    esgComposite,
    investorImpliedYieldPct,
    isInvestmentDeal,
    dealStatus: deal.status,
  };
}

export type DealScoreSnapshotRow = DealScoringEngineResult & {
  id: string;
  createdAt: Date;
};

export async function createBrokerDealScoreSnapshot(dealId: string): Promise<DealScoreSnapshotRow | null> {
  const ctx = await buildDealScoringContext(dealId);
  if (!ctx) return null;

  const engine = computeDealScoring(ctx);

  const row = await prisma.dealScore.create({
    data: {
      dealId,
      score: engine.score,
      category: engine.category,
      riskLevel: engine.riskLevel,
      reasoningJson: {
        version: 1,
        strengths: engine.strengths,
        risks: engine.risks,
        factors: engine.factors,
        recommendation: engine.recommendation,
        category: engine.category,
        riskLevel: engine.riskLevel,
        advisory: DEAL_SCORING_ADVISORY,
      },
    },
  });

  await prisma.deal
    .update({
      where: { id: dealId },
      data: { dealScore: engine.score, riskLevel: engine.riskLevel },
    })
    .catch(() => undefined);

  return {
    ...engine,
    id: row.id,
    createdAt: row.createdAt,
  };
}

export type LatestDealScoreDTO = {
  id: string;
  dealId: string;
  score: number;
  category: string;
  riskLevel: string;
  strengths: string[];
  risks: string[];
  factors: Record<string, number>;
  recommendation: DealScoringEngineResult["recommendation"];
  createdAt: Date;
};

export async function getLatestBrokerDealScore(dealId: string): Promise<LatestDealScoreDTO | null> {
  const row = await prisma.dealScore.findFirst({
    where: { dealId },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return null;

  const reasoning = row.reasoningJson as {
    strengths?: string[];
    risks?: string[];
    factors?: Record<string, number>;
    recommendation?: string;
  };

  return {
    id: row.id,
    dealId: row.dealId,
    score: row.score,
    category: row.category,
    riskLevel: row.riskLevel,
    strengths: reasoning.strengths ?? [],
    risks: reasoning.risks ?? [],
    factors: reasoning.factors ?? {},
    recommendation: (reasoning.recommendation as DealScoringEngineResult["recommendation"]) ?? "REVIEW",
    createdAt: row.createdAt,
  };
}
