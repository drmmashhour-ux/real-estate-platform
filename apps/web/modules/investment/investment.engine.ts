/**
 * CRM listing capital allocator — ranks opportunities using on-platform signals only.
 * Outputs are advisory; execution, suitability, and compliance remain with humans.
 */

import { prisma } from "@/lib/db";
import { bandExpectedRoi, estimateYieldRoi } from "@/modules/investment/roi.calculator";
import { clamp } from "@/modules/investment/recommendation-math";
import {
  captureRetrofitUpstreamFingerprint,
  scheduleDebouncedRetrofitUpstreamRefresh,
} from "@/modules/esg/esg-retrofit-upstream-refresh";

export type InvestmentListingEvaluation = {
  listingId: string;
  score: number;
  expectedROI: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  recommendedInvestmentMajor: number | null;
  rationale: Record<string, unknown>;
};

function riskFromScore(score: number): "LOW" | "MEDIUM" | "HIGH" {
  if (score >= 72) return "LOW";
  if (score >= 48) return "MEDIUM";
  return "HIGH";
}

/**
 * Deterministic composite score from listing price, CRM demand proxies, and compliance caches.
 */
export async function evaluateCrmListingInvestment(listingId: string): Promise<InvestmentListingEvaluation | null> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      price: true,
      crmMarketplaceLive: true,
      complianceScore: true,
      insuranceScore: true,
    },
  });

  if (!listing) return null;

  const [leadDemand, snapshot] = await Promise.all([
    prisma.lecipmBrokerCrmLead.count({ where: { listingId } }),
    prisma.listingComplianceSnapshot.findUnique({
      where: { listingId },
      select: { overallPercent: true },
    }),
  ]);

  let score = 45;
  const rationale: Record<string, unknown> = {
    priceMajor: listing.price,
    crmMarketplaceLive: listing.crmMarketplaceLive,
    leadDemand30Proxy: leadDemand,
  };

  if (listing.crmMarketplaceLive) score += 8;
  const compliance =
    snapshot?.overallPercent ??
    (listing.complianceScore != null && listing.insuranceScore != null
      ? (listing.complianceScore + listing.insuranceScore) / 2
      : listing.complianceScore ?? listing.insuranceScore ?? null);

  if (compliance != null) {
    score += clamp((compliance - 50) * 0.25, -12, 18);
    rationale.complianceBlend = compliance;
  }

  score += clamp(Math.log1p(leadDemand) * 6, 0, 14);

  /** Price efficiency vs arbitrary bands — coarse prior until city benchmarks exist. */
  if (listing.price > 0 && listing.price < 450_000) score += 5;
  if (listing.price >= 1_500_000) score -= 6;

  score = clamp(score, 5, 95);

  const yieldRoi = estimateYieldRoi({
    basisMajor: listing.price,
    annualIncomeMajor: null,
  });

  const composite01 = (score - 5) / 90;
  const expectedROI = bandExpectedRoi({ compositeScore01: composite01, yieldRoi });

  const recommendedInvestmentMajor =
    listing.price > 0 ? Math.round(listing.price * (0.18 + composite01 * 0.12)) : null;

  rationale.method =
    "Rules over CRM listing row + CRM lead counts + cached compliance snapshot — not personalized advice.";

  return {
    listingId: listing.id,
    score,
    expectedROI,
    riskLevel: riskFromScore(score),
    recommendedInvestmentMajor,
    rationale,
  };
}

/**
 * Writes ranked snapshots for dashboards / routing — safe to call from cron.
 */
export async function snapshotInvestmentOpportunities(limit = 40): Promise<{ written: number }> {
  const listings = await prisma.listing.findMany({
    where: { crmMarketplaceLive: true },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  let written = 0;
  for (const row of listings) {
    const ev = await evaluateCrmListingInvestment(row.id);
    if (!ev) continue;

    const fpBefore = await captureRetrofitUpstreamFingerprint(ev.listingId);

    await prisma.investmentOpportunity.create({
      data: {
        listingId: ev.listingId,
        score: ev.score,
        expectedROI: ev.expectedROI,
        riskLevel: ev.riskLevel,
        recommendedInvestmentMajor: ev.recommendedInvestmentMajor,
        rationaleJson: ev.rationale,
      },
    });
    scheduleDebouncedRetrofitUpstreamRefresh(ev.listingId, "acquisition", fpBefore);
    written += 1;
  }

  return { written };
}
