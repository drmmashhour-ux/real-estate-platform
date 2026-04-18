import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { resolveKpiDateRange } from "../broker-kpis/broker-kpi-aggregation.service";
import type { CompanyMetricsWindow, CompanyMetricsSnapshot } from "./company-metrics.types";
import { companyMetricsDisclaimer } from "./company-metrics-explainer";
import type { ExecutiveScope } from "../owner-access/owner-access.types";
import {
  commissionCaseWhereForExecutiveScope,
  dealWhereForExecutiveScope,
  fsboListingWhereForExecutiveScope,
  leadWhereForExecutiveScope,
  officeInvoiceWhereForExecutiveScope,
  officePayoutWhereForExecutiveScope,
} from "./company-metrics-scope";

const ACTIVE = { notIn: ["closed", "cancelled"] as string[] };

export async function aggregateCompanyMetrics(
  scope: ExecutiveScope,
  window: CompanyMetricsWindow,
  custom?: { from: string; to: string },
): Promise<CompanyMetricsSnapshot> {
  const range = resolveKpiDateRange(window, custom);
  const { start, end } = range;
  const dealBase = dealWhereForExecutiveScope(scope);
  const leadBase = leadWhereForExecutiveScope(scope);
  const fsboBase = fsboListingWhereForExecutiveScope(scope);
  const invWhere = officeInvoiceWhereForExecutiveScope(scope);
  const payoutWhere = officePayoutWhereForExecutiveScope(scope);

  const scopeLabel =
    scope.kind === "platform" ? "Plateforme (résidentiel)" : `Bureaux: ${scope.officeIds.length} portée(s)`;

  const [
    totalActiveResidential,
    newListingsInWindow,
    totalLeads,
    qualifiedLeads,
    activeDeals,
    acceptedOffers,
    inExecution,
    closedDeals,
    complianceOpened,
    complianceOpen,
    commissionRows,
    invoiceAgg,
    payoutAgg,
    overdueInvoices,
    blockedReq,
    stuckFinancing,
    metricsSample,
    avgCloseRows,
    topBrokersRaw,
    cityRows,
    pipelineRows,
  ] = await Promise.all([
    prisma.fsboListing.count({
      where: {
        ...fsboBase,
        status: "ACTIVE",
        moderationStatus: "APPROVED",
        archivedAt: null,
      },
    }),
    prisma.fsboListing.count({
      where: { ...fsboBase, createdAt: { gte: start, lte: end } },
    }),
    prisma.lead.count({ where: { ...leadBase, createdAt: { gte: start, lte: end } } }),
    prisma.lead.count({
      where: {
        AND: [
          leadBase,
          { pipelineStatus: { in: ["qualified", "meeting", "negotiation"] } },
          { createdAt: { gte: start, lte: end } },
        ],
      },
    }),
    prisma.deal.count({ where: { ...dealBase, status: ACTIVE } }),
    prisma.deal.count({
      where: {
        ...dealBase,
        status: { in: ["accepted", "inspection", "financing", "closing_scheduled"] },
      },
    }),
    prisma.deal.count({
      where: {
        ...dealBase,
        status: { in: ["inspection", "financing", "closing_scheduled"] },
      },
    }),
    prisma.deal.count({
      where: {
        ...dealBase,
        status: "closed",
        updatedAt: { gte: start, lte: end },
      },
    }),
    prisma.complianceCase.count({
      where: {
        createdAt: { gte: start, lte: end },
        deal: { is: dealBase },
      },
    }),
    prisma.complianceCase.count({
      where: {
        status: { in: ["open", "under_review", "action_required"] },
        deal: { is: dealBase },
      },
    }),
    prisma.brokerageCommissionCase.findMany({
      where: {
        ...commissionCaseWhereForExecutiveScope(scope),
        updatedAt: { gte: start, lte: end },
        status: { in: ["approved", "invoiced", "payout_ready", "paid"] },
      },
      select: { grossCommissionCents: true },
    }),
    invWhere
      ? prisma.officeInvoice.aggregate({
          where: {
            ...invWhere,
            createdAt: { gte: start, lte: end },
          },
          _sum: { totalCents: true },
        })
      : Promise.resolve({ _sum: { totalCents: null as number | null } }),
    payoutWhere
      ? prisma.officePayout.aggregate({
          where: {
            ...payoutWhere,
            createdAt: { gte: start, lte: end },
          },
          _sum: { amountCents: true },
        })
      : Promise.resolve({ _sum: { amountCents: null as number | null } }),
    invWhere
      ? prisma.officeInvoice.count({
          where: {
            ...invWhere,
            status: "overdue",
          },
        })
      : 0,
    prisma.dealRequest.count({
      where: {
        status: "BLOCKED",
        deal: { is: { ...dealBase, status: ACTIVE } },
      },
    }),
    prisma.deal.count({
      where: {
        ...dealBase,
        status: "financing",
        updatedAt: { lt: new Date(Date.now() - 14 * 86400000) },
      },
    }),
    prisma.fsboListing.findMany({
      where: fsboBase,
      select: { id: true, metrics: { select: { engagementScore: true } } },
      take: 400,
    }),
    prisma.deal.findMany({
      where: {
        ...dealBase,
        status: "closed",
        updatedAt: { gte: start, lte: end },
      },
      select: { createdAt: true, updatedAt: true },
      take: 400,
    }),
    prisma.deal.groupBy({
      by: ["brokerId"],
      where: {
        ...dealBase,
        brokerId: { not: null },
        status: "closed",
        updatedAt: { gte: start, lte: end },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    prisma.fsboListing.groupBy({
      by: ["city"],
      where: fsboBase,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    prisma.deal.groupBy({
      by: ["status"],
      where: { ...dealBase, status: { notIn: ["closed", "cancelled"] } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 20,
    }),
  ]);

  const listingIds = metricsSample.map((m) => m.id);
  const engagementScores = metricsSample
    .map((m) => m.metrics?.engagementScore)
    .filter((n): n is number => n != null && Number.isFinite(n));
  const marketingEngagementAvg =
    engagementScores.length > 0
      ? Math.round((engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length) * 10) / 10
      : null;

  const totalCommissionVolumeCents = commissionRows.reduce((a, r) => a + r.grossCommissionCents, 0);

  const officeShare = await prisma.brokerageCommissionSplitLine.aggregate({
    where: {
      splitCategory: "office_share",
      commissionCase: {
        ...commissionCaseWhereForExecutiveScope(scope),
        updatedAt: { gte: start, lte: end },
        status: { in: ["approved", "invoiced", "payout_ready", "paid"] },
      },
    },
    _sum: { amountCents: true },
  });

  const brokerIds = topBrokersRaw.map((t) => t.brokerId).filter(Boolean) as string[];
  const brokers = await prisma.user.findMany({
    where: { id: { in: brokerIds } },
    select: { id: true, name: true },
  });
  const nameById = new Map(brokers.map((b) => [b.id, b.name]));

  const topBrokers = topBrokersRaw.map((t) => ({
    brokerId: t.brokerId!,
    brokerName: nameById.get(t.brokerId!) ?? null,
    closedDeals: t._count.id,
    grossCommissionCents: 0,
  }));

  const { avgResp, nResp } = await avgResponseForScope(scope, start, end);
  const { offerDays, nOffer } = await avgFirstOfferForScope(dealBase, start, end);
  let sumDays = 0;
  for (const d of avgCloseRows) {
    sumDays += (d.updatedAt.getTime() - d.createdAt.getTime()) / (3600000 * 24);
  }
  const avgTimeToCloseDays = avgCloseRows.length ? Math.round((sumDays / avgCloseRows.length) * 10) / 10 : null;

  return {
    range: { startIso: start.toISOString(), endIso: end.toISOString(), label: window },
    generatedAt: new Date().toISOString(),
    scopeLabel,
    listings: {
      totalActiveResidential,
      newListingsInWindow,
      marketingEngagementAvg,
      engagementSampleSize: metricsSample.length,
    },
    leads: { totalLeads, qualifiedLeads },
    deals: {
      active: activeDeals,
      acceptedOffers,
      inExecution,
      closed: closedDeals,
    },
    compliance: { casesOpened: complianceOpened, openCases: complianceOpen },
    finance: {
      totalCommissionVolumeCents: totalCommissionVolumeCents,
      brokerageRevenueOfficeShareCents: officeShare._sum.amountCents ?? 0,
      brokerPayoutTotalCents: payoutAgg._sum.amountCents ?? 0,
      invoiceTotalCents: invoiceAgg._sum.totalCents ?? 0,
      overdueInvoices,
    },
    velocity: {
      avgResponseTimeHours: avgResp,
      responseSampleSize: nResp,
      avgTimeToAcceptedOfferDays: offerDays,
      acceptedOfferSampleSize: nOffer,
      avgTimeToCloseDays,
      closeSampleSize: avgCloseRows.length,
    },
    blockers: {
      blockedDealRequests: blockedReq,
      overdueInvoices,
      dealsStuckFinancing: stuckFinancing,
    },
    rankings: {
      topBrokers,
      topNeighborhoods: cityRows.map((c) => ({
        city: c.city,
        inquiryCount: 0,
        activeListings: c._count.id,
      })),
      bottlenecksByStage: pipelineRows.map((p) => ({ stage: p.status, dealCount: p._count.id })),
    },
    disclaimer: companyMetricsDisclaimer(),
  };
}

async function avgResponseForScope(
  scope: ExecutiveScope,
  start: Date,
  end: Date,
): Promise<{ avgResp: number | null; nResp: number }> {
  const leadWhere = leadWhereForExecutiveScope(scope);
  const leads = await prisma.lead.findMany({
    where: { ...leadWhere, createdAt: { gte: start, lte: end } },
    select: { id: true, createdAt: true, introducedByBrokerId: true },
    take: 120,
  });
  const deltas: number[] = [];
  for (const l of leads) {
    if (!l.introducedByBrokerId) continue;
    const first = await prisma.crmInteraction.findFirst({
      where: { leadId: l.id, brokerId: l.introducedByBrokerId },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    if (first) deltas.push((first.createdAt.getTime() - l.createdAt.getTime()) / 3600000);
  }
  if (deltas.length === 0) return { avgResp: null, nResp: 0 };
  const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  return { avgResp: Math.round(avg * 10) / 10, nResp: deltas.length };
}

async function avgFirstOfferForScope(
  dealBase: Prisma.DealWhereInput,
  start: Date,
  end: Date,
): Promise<{ offerDays: number | null; nOffer: number }> {
  const dealIds = (
    await prisma.deal.findMany({
      where: dealBase,
      select: { id: true },
      take: 500,
    })
  ).map((d) => d.id);
  if (dealIds.length === 0) return { offerDays: null, nOffer: 0 };
  const proposals = await prisma.negotiationProposal.findMany({
    where: {
      proposalType: "initial_offer",
      createdAt: { gte: start, lte: end },
      round: { thread: { dealId: { in: dealIds } } },
    },
    select: {
      createdAt: true,
      round: { select: { thread: { select: { deal: { select: { createdAt: true } } } } } },
    },
    take: 400,
  });
  const deltas: number[] = [];
  for (const p of proposals) {
    const dc = p.round?.thread?.deal?.createdAt;
    if (!dc) continue;
    deltas.push((p.createdAt.getTime() - dc.getTime()) / (3600000 * 24));
  }
  if (deltas.length === 0) return { offerDays: null, nOffer: 0 };
  deltas.sort((a, b) => a - b);
  const mid = Math.floor(deltas.length / 2);
  const med = deltas.length % 2 ? deltas[mid]! : (deltas[mid - 1]! + deltas[mid]!) / 2;
  return { offerDays: Math.round(med * 10) / 10, nOffer: deltas.length };
}
