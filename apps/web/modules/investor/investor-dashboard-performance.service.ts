import type { InvestorAccess, InvestmentRecommendation } from "@prisma/client";
import { prisma } from "@/lib/db";
import { listBnhubListingIdsForInvestorScope } from "@/modules/investment/investor-recommendation-access.service";

function modeledDealExitValue(propertyPrice: number, roiPercent: number): number {
  return propertyPrice * (1 + roiPercent / 100);
}

export type InvestorDashboardDealRow = {
  id: string;
  listingId: string;
  title: string;
  city: string;
  listingStatus: string;
  amountInvested: number | null;
  estimatedValue: number | null;
  status: string;
  returnEstimatePercent: number | null;
  recommendation: string | null;
  recommendationConfidence: number | null;
};

export type InvestorDashboardPayload = {
  ok: true;
  source: "bnhub" | "analysis_only";
  disclaimer: string;
  scope?: { scopeType: string; scopeId: string; email: string };
  overview: {
    totalInvested: number;
    totalValue: number;
    profitLoss: number;
    profitLossPercent: number | null;
    activeDeals: number;
    currency: string;
  };
  deals: InvestorDashboardDealRow[];
  performance: {
    realizedReturns: number;
    unrealizedReturns: number;
    notes: string;
    currency: string;
  };
  reports: {
    monthly: Array<{ period: string; revenue: number; bookings: number }>;
    yearly: Array<{ year: string; revenue: number; bookings: number }>;
  };
  documents: Array<{
    kind: "report" | "agreement" | "signature";
    title: string;
    createdAt: string;
    reportLogId?: string;
    documentType?: string;
    formKey?: string;
  }>;
  analyses: Array<{
    id: string;
    city: string;
    propertyPrice: number;
    modeledValue: number;
    roi: number;
    rating: string;
    createdAt: string;
  }>;
};

function parseReportMeta(meta: unknown): { revenue: number; bookings: number } {
  if (!meta || typeof meta !== "object") return { revenue: 0, bookings: 0 };
  const m = meta as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" ? v : Number(v)) || 0;
  return { revenue: num(m.revenue), bookings: Math.round(num(m.bookings)) };
}

function latestRecByListing(
  rows: InvestmentRecommendation[],
): Map<string, InvestmentRecommendation> {
  const m = new Map<string, InvestmentRecommendation>();
  for (const r of rows) {
    if (r.scopeType !== "listing") continue;
    if (!m.has(r.scopeId)) m.set(r.scopeId, r);
  }
  return m;
}

/**
 * BNHub investor portal — listings under scoped host + recommendations + report history.
 */
export async function buildBnhubInvestorDashboard(
  userId: string,
  investor: InvestorAccess,
): Promise<InvestorDashboardPayload> {
  const listingIds = await listBnhubListingIdsForInvestorScope(investor);
  const [listings, recs, logs, agreements, signatures, analyses] = await Promise.all([
    listingIds.length
      ? prisma.shortTermListing.findMany({
          where: { id: { in: listingIds } },
          select: {
            id: true,
            title: true,
            city: true,
            listingStatus: true,
            investmentPurchasePriceMajor: true,
            investmentEstimatedValueMajor: true,
            nightPriceCents: true,
          },
        })
      : [],
    listingIds.length
      ? prisma.investmentRecommendation.findMany({
          where: { scopeType: "listing", scopeId: { in: listingIds }, status: "active" },
          orderBy: { createdAt: "desc" },
          take: 500,
        })
      : ([] as InvestmentRecommendation[]),
    prisma.reportDeliveryLog.findMany({
      where: {
        scopeType: investor.scopeType,
        scopeId: investor.scopeId,
        status: "success",
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, createdAt: true, meta: true },
    }),
    prisma.userAgreement.findMany({
      where: { userId },
      orderBy: { acceptedAt: "desc" },
      take: 40,
      select: { documentType: true, version: true, acceptedAt: true },
    }),
    prisma.legalFormSignature.findMany({
      where: { userId },
      orderBy: { signedAt: "desc" },
      take: 40,
      select: { formKey: true, contextType: true, signedAt: true },
    }),
    prisma.investmentDeal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        city: true,
        propertyPrice: true,
        roi: true,
        rating: true,
        createdAt: true,
      },
    }),
  ]);

  const recMap = latestRecByListing(recs);

  let totalInvested = 0;
  let totalValue = 0;

  const deals: InvestorDashboardDealRow[] = listings.map((l) => {
    const invested = l.investmentPurchasePriceMajor;
    const est =
      l.investmentEstimatedValueMajor ??
      (l.nightPriceCents > 0 ? Math.round((l.nightPriceCents / 100) * 365 * 0.45) : null);
    const r = recMap.get(l.id);
    if (invested != null && Number.isFinite(invested)) {
      totalInvested += invested;
    }
    if (est != null && Number.isFinite(est)) {
      totalValue += est;
    } else if (invested != null) {
      totalValue += invested;
    }

    const returnEst =
      r && Number.isFinite(r.score) ? Math.min(99, Math.max(-99, (r.score - 50) * 1.2)) : null;

    return {
      id: l.id,
      listingId: l.id,
      title: l.title,
      city: l.city,
      listingStatus: String(l.listingStatus),
      amountInvested: invested ?? null,
      estimatedValue: est ?? null,
      status: r?.recommendation ?? "active",
      returnEstimatePercent: returnEst,
      recommendation: r?.recommendation ?? null,
      recommendationConfidence: r?.confidenceScore ?? null,
    };
  });

  const activeDeals = deals.filter(
    (d) => d.listingStatus === "PUBLISHED" && d.recommendation !== "sell",
  ).length;

  const profitLoss = totalValue - totalInvested;
  const profitLossPercent =
    totalInvested > 0 ? Math.round((profitLoss / totalInvested) * 10_000) / 100 : null;

  const monthlyMap = new Map<string, { revenue: number; bookings: number }>();
  const yearlyMap = new Map<string, { revenue: number; bookings: number }>();
  let realized = 0;
  if (logs.length > 0) {
    const first = parseReportMeta(logs[0]?.meta);
    const last = parseReportMeta(logs[logs.length - 1]?.meta);
    realized = Math.max(0, last.revenue - first.revenue);
  }
  /** `meta.revenue` is treated as cumulative (see `/api/investor/performance`); keep last snapshot per period. */
  const monthBest = new Map<string, { at: Date; revenue: number; bookings: number }>();
  const yearBest = new Map<string, { at: Date; revenue: number; bookings: number }>();
  for (const log of logs) {
    const k = parseReportMeta(log.meta);
    const y = String(log.createdAt.getUTCFullYear());
    const mo = `${y}-${String(log.createdAt.getUTCMonth() + 1).padStart(2, "0")}`;
    const bump = (m: Map<string, { at: Date; revenue: number; bookings: number }>, key: string) => {
      const prev = m.get(key);
      if (!prev || log.createdAt >= prev.at) {
        m.set(key, { at: log.createdAt, revenue: k.revenue, bookings: k.bookings });
      }
    };
    bump(monthBest, mo);
    bump(yearBest, y);
  }
  for (const [period, v] of monthBest.entries()) {
    monthlyMap.set(period, { revenue: v.revenue, bookings: v.bookings });
  }
  for (const [year, v] of yearBest.entries()) {
    yearlyMap.set(year, { revenue: v.revenue, bookings: v.bookings });
  }

  const monthly = [...monthlyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, v]) => ({ period, ...v }));
  const yearly = [...yearlyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, v]) => ({ year, ...v }));

  const documents: InvestorDashboardPayload["documents"] = [
    ...logs.map((l) => ({
      kind: "report" as const,
      title: `Performance report · ${l.createdAt.toISOString().slice(0, 10)}`,
      createdAt: l.createdAt.toISOString(),
      reportLogId: l.id,
    })),
    ...agreements.map((a) => ({
      kind: "agreement" as const,
      title: `Accepted: ${a.documentType} v${a.version}`,
      createdAt: a.acceptedAt.toISOString(),
      documentType: a.documentType,
    })),
    ...signatures.map((s) => ({
      kind: "signature" as const,
      title: `Signed: ${s.formKey} (${s.contextType})`,
      createdAt: s.signedAt.toISOString(),
      formKey: s.formKey,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    ok: true,
    source: "bnhub",
    disclaimer:
      "Figures combine listing investment fields and recommendation scores where available. They are illustrative, not audited statements. Downloadable reports are scope-bound.",
    scope: { scopeType: investor.scopeType, scopeId: investor.scopeId, email: investor.email },
    overview: {
      totalInvested,
      totalValue,
      profitLoss,
      profitLossPercent,
      activeDeals,
      currency: "CAD",
    },
    deals,
    performance: {
      realizedReturns: realized,
      unrealizedReturns: profitLoss,
      notes:
        "Realized = change in cumulative revenue reported between first and latest successful report delivery. Unrealized = estimated value minus modeled invested capital.",
      currency: "CAD",
    },
    reports: { monthly, yearly },
    documents,
    analyses: analyses.map((a) => ({
      id: a.id,
      city: a.city,
      propertyPrice: a.propertyPrice,
      currentValue: a.currentValue,
      roi: a.roi,
      rating: a.rating,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

/**
 * Saved ROI analyses only (no BNHub investor scope).
 */
export async function buildAnalysisOnlyInvestorDashboard(userId: string): Promise<InvestorDashboardPayload> {
  const deals = await prisma.investmentDeal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  const totalInvested = deals.reduce((s, d) => s + d.propertyPrice, 0);
  const totalValue = deals.reduce((s, d) => s + modeledDealExitValue(d.propertyPrice, d.roi), 0);
  const profitLoss = totalValue - totalInvested;
  const profitLossPercent =
    totalInvested > 0 ? Math.round((profitLoss / totalInvested) * 10_000) / 100 : null;

  const [agreements, signatures] = await Promise.all([
    prisma.userAgreement.findMany({
      where: { userId },
      orderBy: { acceptedAt: "desc" },
      take: 40,
      select: { documentType: true, version: true, acceptedAt: true },
    }),
    prisma.legalFormSignature.findMany({
      where: { userId },
      orderBy: { signedAt: "desc" },
      take: 40,
      select: { formKey: true, contextType: true, signedAt: true },
    }),
  ]);

  const documents: InvestorDashboardPayload["documents"] = [
    ...agreements.map((a) => ({
      kind: "agreement" as const,
      title: `Accepted: ${a.documentType} v${a.version}`,
      createdAt: a.acceptedAt.toISOString(),
      documentType: a.documentType,
    })),
    ...signatures.map((s) => ({
      kind: "signature" as const,
      title: `Signed: ${s.formKey} (${s.contextType})`,
      createdAt: s.signedAt.toISOString(),
      formKey: s.formKey,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    ok: true,
    source: "analysis_only",
    disclaimer:
      "Portfolio is built from saved deal analyses (InvestmentDeal). Connect BNHub investor access for listing-level performance and scheduled reports.",
    overview: {
      totalInvested,
      totalValue,
      profitLoss,
      profitLossPercent,
      activeDeals: deals.length,
      currency: "CAD",
    },
    deals: deals.map((d: InvestmentDeal) => ({
      id: d.id,
      listingId: d.id,
      title: `${d.city} · analyzed`,
      city: d.city,
      listingStatus: "ANALYSIS",
      amountInvested: d.propertyPrice,
      estimatedValue: d.currentValue ?? d.propertyPrice * (1 + d.roi / 100),
      status: d.rating,
      returnEstimatePercent: d.roi,
      recommendation: d.preferredStrategy,
      recommendationConfidence: null,
    })),
    performance: {
      realizedReturns: 0,
      unrealizedReturns: profitLoss,
      notes: "No distribution history in this view — unrealized reflects modeled value vs. purchase assumptions.",
      currency: "CAD",
    },
    reports: { monthly: [], yearly: [] },
    documents,
    analyses: deals.map((a) => ({
      id: a.id,
      city: a.city,
      propertyPrice: a.propertyPrice,
      modeledValue: modeledDealExitValue(a.propertyPrice, a.roi),
      roi: a.roi,
      rating: a.rating,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}
