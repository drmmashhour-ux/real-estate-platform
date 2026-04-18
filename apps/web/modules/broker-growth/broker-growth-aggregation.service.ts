import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { aggregateBrokerKpis, buildBrokerKpiSnapshot, resolveKpiDateRange } from "../broker-kpis/broker-kpi-aggregation.service";
import type { BrokerKpiSnapshot, KpiDateRange, KpiWindow } from "../broker-kpis/broker-kpis.types";
import { residentialBrokerFsboWhere } from "@/lib/broker/residential-fsbo-scope";
import type { BrokerGrowthMetrics } from "./broker-growth.types";

const APPROVED_COMMISSION = {
  in: ["approved", "invoiced", "payout_ready", "paid"] as const,
};

type CoreKpi = Awaited<ReturnType<typeof aggregateBrokerKpis>>;

export async function aggregateBrokerGrowthMetrics(
  brokerId: string,
  range: KpiDateRange,
  core: CoreKpi,
): Promise<BrokerGrowthMetrics> {
  const { start, end } = range;
  const listingWhere: Prisma.FsboListingWhereInput = residentialBrokerFsboWhere(brokerId);

  const listingIds = (
    await prisma.fsboListing.findMany({
      where: listingWhere,
      select: { id: true },
    })
  ).map((r) => r.id);

  const activeResidentialListings = await prisma.fsboListing.count({
    where: {
      ...listingWhere,
      status: "ACTIVE",
      moderationStatus: "APPROVED",
      archivedAt: null,
    },
  });

  const dealBase: Prisma.DealWhereInput = { brokerId };
  const dealIdsRows = await prisma.deal.findMany({ where: dealBase, select: { id: true } });
  const dealIds = dealIdsRows.map((d) => d.id);

  const [
    listingViews,
    listingSaves,
    fsboInquiries,
    crmInquiriesOnListings,
    metricsRows,
    proposalsInWindow,
    wonLeads,
    lostLeads,
    blockedDeals,
    splitLines,
    repeatUsers,
    referralLeads,
  ] = await Promise.all([
    listingIds.length === 0
      ? 0
      : prisma.buyerListingView.count({
          where: { fsboListingId: { in: listingIds }, createdAt: { gte: start, lte: end } },
        }),
    listingIds.length === 0
      ? 0
      : prisma.buyerSavedListing.count({
          where: { fsboListingId: { in: listingIds }, createdAt: { gte: start, lte: end } },
        }),
    listingIds.length === 0
      ? 0
      : prisma.fsboLead.count({
          where: { listingId: { in: listingIds }, createdAt: { gte: start, lte: end } },
        }),
    listingIds.length === 0
      ? 0
      : prisma.lead.count({
          where: {
            fsboListingId: { in: listingIds },
            introducedByBrokerId: brokerId,
            createdAt: { gte: start, lte: end },
          },
        }),
    listingIds.length === 0
      ? []
      : prisma.fsboListingMetrics.findMany({
          where: { fsboListingId: { in: listingIds } },
          select: { engagementScore: true },
        }),
    dealIds.length === 0
      ? 0
      : prisma.negotiationProposal.count({
          where: {
            createdAt: { gte: start, lte: end },
            round: { thread: { dealId: { in: dealIds } } },
          },
        }),
    prisma.lead.count({
      where: {
        introducedByBrokerId: brokerId,
        pipelineStatus: "won",
        updatedAt: { gte: start, lte: end },
      },
    }),
    prisma.lead.count({
      where: {
        introducedByBrokerId: brokerId,
        pipelineStatus: "lost",
        updatedAt: { gte: start, lte: end },
      },
    }),
    dealIds.length === 0
      ? 0
      : prisma.dealRequest.count({
          where: {
            dealId: { in: dealIds },
            status: "BLOCKED",
          },
        }),
    prisma.brokerageCommissionSplitLine.findMany({
      where: {
        payeeKind: "broker",
        payeeUserId: brokerId,
        commissionCase: {
          brokerUserId: brokerId,
          status: { in: [...APPROVED_COMMISSION.in] },
          transactionType: "residential_sale",
          updatedAt: { gte: start, lte: end },
        },
      },
      select: { amountCents: true },
    }),
    prisma.lead.groupBy({
      by: ["userId"],
      where: {
        introducedByBrokerId: brokerId,
        userId: { not: null },
        createdAt: { gte: start, lte: end },
      },
      _count: { id: true },
    }),
    prisma.lead.count({
      where: {
        introducedByBrokerId: brokerId,
        createdAt: { gte: start, lte: end },
        OR: [{ source: { contains: "referral" } }, { leadSource: { contains: "referral" } }],
      },
    }),
  ]);

  const listingInquiries = fsboInquiries + crmInquiriesOnListings;
  const inquiryDenom = listingViews > 0 ? listingViews : null;
  const listingInquiryRate = inquiryDenom ? Math.round((listingInquiries / inquiryDenom) * 10000) / 10000 : null;
  const listingSaveRate = inquiryDenom ? Math.round((listingSaves / inquiryDenom) * 10000) / 10000 : null;

  const engagementScores = metricsRows.map((m) => m.engagementScore).filter((n) => Number.isFinite(n));
  const listingMarketingEngagementIndexAvg =
    engagementScores.length > 0
      ? Math.round((engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length) * 10) / 10
      : null;

  const convDenom = wonLeads + lostLeads;
  const leadConversionRate = convDenom > 0 ? Math.round((wonLeads / convDenom) * 1000) / 1000 : null;

  const offerActivityRate =
    activeResidentialListings > 0 ? Math.round((proposalsInWindow / activeResidentialListings) * 1000) / 1000 : null;

  const avgResponse = core.lead.avgResponseTimeHours;
  const nResp = core.lead.responseSampleSize;

  const { firstOfferDays, nOfferLatency } = await computeFirstOfferLatencyDays(dealIds, start, end);
  const closingDays = core.closing.offerToCloseDaysAvg;
  const closingN = core.closing.offerToCloseSampleSize;

  const brokerRevenueEstimateCents =
    splitLines.length > 0 ? splitLines.reduce((a, l) => a + l.amountCents, 0) : null;

  const repeatClientLeadIndicator = repeatUsers.filter((g) => g.userId && g._count.id > 1).length;

  return {
    listings: {
      activeResidentialListings,
      listingViews,
      listingSaves,
      listingInquiries,
      listingInquiryRate,
      listingSaveRate,
      listingMarketingEngagementIndexAvg,
      engagementSampleSize: metricsRows.length,
    },
    pipeline: {
      leadConversionRate,
      leadConversionSampleWon: wonLeads,
      leadConversionSampleLost: lostLeads,
      offerActivityRate,
    },
    velocity: {
      avgTimeToFirstResponseHours: avgResponse,
      responseSampleSize: nResp,
      avgTimeToAcceptedOfferDays: firstOfferDays,
      acceptedOfferSampleSize: nOfferLatency,
      avgTimeToCloseDays: closingDays,
      closeSampleSize: closingN,
      activeDealCount: core.deal.activeDeals,
      blockedDealCount: blockedDeals,
    },
    revenue: {
      brokerRevenueEstimateCents: brokerRevenueEstimateCents,
      commissionCaseSampleSize: splitLines.length,
    },
    referral: {
      repeatClientLeadIndicator,
      referralAttributedLeads: referralLeads,
    },
  };
}

/** Median days from deal creation to first initial_offer proposal in window (proxy for negotiation velocity). */
async function computeFirstOfferLatencyDays(
  dealIds: string[],
  start: Date,
  end: Date,
): Promise<{ firstOfferDays: number | null; nOfferLatency: number }> {
  if (dealIds.length === 0) return { firstOfferDays: null, nOfferLatency: 0 };

  const proposals = await prisma.negotiationProposal.findMany({
    where: {
      proposalType: "initial_offer",
      createdAt: { gte: start, lte: end },
      round: { thread: { dealId: { in: dealIds } } },
    },
    select: {
      createdAt: true,
      round: { select: { thread: { select: { deal: { select: { createdAt: true, id: true } } } } } },
    },
    take: 400,
  });

  const deltas: number[] = [];
  for (const p of proposals) {
    const dc = p.round?.thread?.deal?.createdAt;
    if (!dc) continue;
    deltas.push((p.createdAt.getTime() - dc.getTime()) / (3600000 * 24));
  }
  if (deltas.length === 0) return { firstOfferDays: null, nOfferLatency: 0 };
  deltas.sort((a, b) => a - b);
  const mid = Math.floor(deltas.length / 2);
  const med = deltas.length % 2 ? deltas[mid]! : (deltas[mid - 1]! + deltas[mid]!) / 2;
  return { firstOfferDays: Math.round(med * 10) / 10, nOfferLatency: deltas.length };
}

export async function buildBrokerGrowthDashboardSnapshot(
  brokerId: string,
  window: KpiWindow,
  custom?: { from: string; to: string },
): Promise<{ kpi: BrokerKpiSnapshot; growth: BrokerGrowthMetrics; residentialScopeNote: string }> {
  const range = resolveKpiDateRange(window, custom);
  const coreKpi = await aggregateBrokerKpis(brokerId, range);
  const growth = await aggregateBrokerGrowthMetrics(brokerId, range, coreKpi);
  const kpi = buildBrokerKpiSnapshot(window, range, coreKpi);

  return {
    kpi,
    growth,
    residentialScopeNote:
      "Residential sale listings: broker-managed FSBO inventory (`listingOwnerType=BROKER`, `listingDealType=SALE`). Excludes commercial and non-residential categories.",
  };
}
