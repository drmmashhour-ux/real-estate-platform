import type { PlatformRole } from "@prisma/client";
import { subDays } from "date-fns";

import type {
  CommandCenterDealRow,
  CommandCenterLeadRow,
  CommandCenterSummaryPayload,
  MarketingExpansionData,
  TrustRiskPanelData,
  ExecutiveSummaryKpis,
} from "./command-center.types";
import { isExecutiveCommandCenter } from "./command-center.types";

import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

function moneyCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`;
}

function dealWhereForBroker(userId: string, role: PlatformRole) {
  if (isExecutiveCommandCenter(role)) {
    return {};
  }
  return { brokerId: userId };
}

export async function loadCommandCenterSummary(userId: string, role: PlatformRole): Promise<CommandCenterSummaryPayload> {
  const since = subDays(new Date(), 30);
  const dw = dealWhereForBroker(userId, role);

  const [
    activeDealsAgg,
    pipelineSum,
    visitsCount,
    leadsNew,
    dealsClosedRecent,
    trustSnap,
    openDisputes,
    disputePred,
    trustAlertsRecent,
    pipelineLeadsHot,
    pipelineLeadsStale,
    dealsPriority,
    dealsStalled,
    ceoPending,
    publishJobs,
  ] = await Promise.all([
    prisma.deal.count({
      where: {
        ...dw,
        NOT: { status: { in: ["cancelled", "closed"] } },
      },
    }),
    prisma.deal.aggregate({
      where: {
        ...dw,
        NOT: { status: { in: ["cancelled", "closed"] } },
      },
      _sum: { priceCents: true },
    }),
    prisma.lecipmVisit.count({
      where:
        isExecutiveCommandCenter(role) ?
          { startDateTime: { gte: new Date() }, status: { not: "cancelled" } }
        : {
            brokerUserId: userId,
            startDateTime: { gte: new Date() },
            status: { not: "cancelled" },
          },
    }),
    prisma.lecipmCrmPipelineLead.count({
      where: {
        brokerId: userId,
        createdAt: { gte: since },
      },
    }),
    prisma.deal.count({
      where: {
        ...dw,
        status: "closed",
        updatedAt: { gte: since },
      },
    }),
    prisma.lecipmOperationalTrustSnapshot.findFirst({
      where: { targetType: "BROKER", targetId: userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lecipmDisputeCase.count({
      where: { status: { in: ["OPEN", "IN_REVIEW", "ESCALATED"] } },
    }),
    isExecutiveCommandCenter(role) ?
      prisma.lecipmDisputePredictionSnapshot.findFirst({
        orderBy: { createdAt: "desc" },
      })
    : Promise.resolve(null),
    prisma.lecipmOperationalTrustAlert.findMany({
      where: isExecutiveCommandCenter(role) ? {} : { targetType: "BROKER", targetId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.lecipmCrmPipelineLead.findMany({
      where: { brokerId: userId },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { contact: { select: { fullName: true, email: true } } },
    }),
    prisma.lecipmCrmPipelineLead.findMany({
      where: {
        brokerId: userId,
        status: "new",
        updatedAt: { lte: subDays(new Date(), 14) },
      },
      take: 5,
      include: { contact: { select: { fullName: true, email: true } } },
    }),
    prisma.deal.findMany({
      where: { ...dw, NOT: { status: { in: ["cancelled", "closed"] } } },
      orderBy: [{ updatedAt: "desc" }],
      take: 5,
      select: {
        id: true,
        status: true,
        crmStage: true,
        priceCents: true,
        dealScore: true,
        riskLevel: true,
        updatedAt: true,
      },
    }),
    prisma.deal.findMany({
      where: {
        ...dw,
        NOT: { status: { in: ["cancelled", "closed"] } },
        updatedAt: { lte: subDays(new Date(), 10) },
      },
      orderBy: { updatedAt: "asc" },
      take: 4,
      select: {
        id: true,
        status: true,
        crmStage: true,
        priceCents: true,
        dealScore: true,
        riskLevel: true,
        updatedAt: true,
      },
    }),
    prisma.lecipmSystemBehaviorAdjustment.count({ where: { status: "PROPOSED" } }).catch(() => 0),
    prisma.marketingPublishJob
      .count({ where: { status: { in: ["SCHEDULED", "RUNNING"] } } })
      .catch(() => 0),
  ]);

  const pipelineCents = pipelineSum._sum.priceCents ?? 0;
  const conversionPct =
    leadsNew > 0 ? Math.min(100, Math.round((dealsClosedRecent / Math.max(leadsNew, 1)) * 100)) : 0;

  const executive: ExecutiveSummaryKpis = {
    revenueDisplay: moneyCents(pipelineCents),
    revenueTrend: pipelineCents > 0 ? "healthy" : "inactive",
    revenueHint: "Pipeline value (active deals)",
    activeDeals: activeDealsAgg,
    dealsTrend: activeDealsAgg > 0 ? "attention" : "inactive",
    bookedVisits: visitsCount,
    visitsTrend: visitsCount > 0 ? "healthy" : "inactive",
    conversionRateDisplay: `${conversionPct}%`,
    conversionTrend:
      conversionPct >= 20 ? "healthy"
      : conversionPct >= 10 ? "attention"
      : "inactive",
    trustScore: trustSnap?.trustScore ?? null,
    trustBand: trustSnap?.trustBand ?? null,
    trustTrend:
      trustSnap ?
        trustSnap.trustScore >= 70 ? "healthy"
        : trustSnap.trustScore >= 50 ? "attention"
        : "urgent"
      : "inactive",
    automationDisplay: ceoPending > 0 ? `${ceoPending} pending reviews` : "Systems nominal",
    automationTrend: ceoPending > 3 ? "attention" : "healthy",
  };

  const trustRisk: TrustRiskPanelData = {
    trustScore: trustSnap?.trustScore ?? null,
    trustBand: trustSnap?.trustBand ?? null,
    disputeRiskScore: disputePred?.disputeRiskScore ?? null,
    openDisputes,
    complianceNotes:
      trustAlertsRecent.length ?
        trustAlertsRecent.map((a) => a.message.slice(0, 120))
      : ["No urgent compliance signals in the latest window."],
    topIssues: trustAlertsRecent.slice(0, 3).map((a) => a.message.slice(0, 160)),
    sharpestDrops: [],
    remediationLinks:
      isExecutiveCommandCenter(role) ?
        [
          { label: "Operational trust", href: "/dashboard/admin/trust-score" },
          { label: "Dispute prediction", href: "/dashboard/admin/dispute-prediction" },
          { label: "Compliance hub", href: "/dashboard/broker/compliance/command-center" },
        ]
      : [
          { label: "Operational trust", href: "/dashboard/broker/trust" },
          { label: "Residential deals", href: "/dashboard/lecipm/deals" },
          { label: "Compliance", href: "/dashboard/lecipm/compliance" },
        ],
  };

  const priorityDeals: CommandCenterDealRow[] = dealsPriority.map((d) => ({
    id: d.id,
    label: `Deal ${d.id.slice(0, 8)}`,
    stage: d.crmStage ?? d.status,
    priceCents: d.priceCents,
    score: d.dealScore != null ? Math.round(d.dealScore) : null,
    riskHint: d.riskLevel,
    updatedAt: d.updatedAt.toISOString(),
  }));

  const stalledDeals: CommandCenterDealRow[] = dealsStalled.map((d) => ({
    id: d.id,
    label: `Deal ${d.id.slice(0, 8)}`,
    stage: d.crmStage ?? d.status,
    priceCents: d.priceCents,
    score: d.dealScore != null ? Math.round(d.dealScore) : null,
    riskHint: d.riskLevel,
    updatedAt: d.updatedAt.toISOString(),
  }));

  const hotLeads: CommandCenterLeadRow[] = pipelineLeadsHot.slice(0, 5).map((l) => ({
    id: l.id,
    contactLabel: l.contact?.fullName ?? l.contact?.email ?? "Lead",
    intentLevel: l.intentLevel,
    status: l.status,
    createdAt: l.createdAt.toISOString(),
    source: l.source,
  }));

  const followUpLeads: CommandCenterLeadRow[] = pipelineLeadsStale.map((l) => ({
    id: l.id,
    contactLabel: l.contact?.fullName ?? l.contact?.email ?? "Lead",
    intentLevel: l.intentLevel,
    status: l.status,
    createdAt: l.createdAt.toISOString(),
    source: l.source,
  }));

  const marketing: MarketingExpansionData = {
    scheduledHint:
      publishJobs > 0 ? `${publishJobs} publish jobs queued or scheduled.` : "Publishing queue clear — schedule from Marketing Studio.",
    campaignHint: "Review campaigns in Growth Machine for channel mix.",
    expansionHint: "Territory expansion signals live in Self-Expansion war room.",
    territoryOpportunity: "Compare territory momentum in Market Domination dashboard.",
    nextMove:
      ceoPending > 0 ?
        `Review ${ceoPending} AI CEO adjustment proposal(s) before automation expands.`
      : "Growth Brain suggests focusing on stalled pipeline leads this week.",
    links: [
      { label: "Growth Machine", href: "/dashboard/growth" },
      { label: "Self-expansion", href: "/dashboard/admin/self-expansion" },
      { label: "Marketing AI", href: "/dashboard/admin/marketing-ai/daily" },
      { label: "Territory war room", href: "/dashboard/admin/territory-war-room" },
    ],
  };

  return {
    executive,
    revenueGrowthHint: "Pipeline excludes cancelled/closed deals — advisory totals only.",
    priorityDeals,
    stalledDeals,
    hotLeads,
    followUpLeads,
    trustRisk,
    marketing,
    generatedAt: new Date().toISOString(),
  };
}
