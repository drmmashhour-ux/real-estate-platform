import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { PLATFORM_BNHUB_HOST_FEE_RATE } from "@/lib/leads/commission";
import { normalizePipelineStage } from "@/lib/leads/pipeline-stage";

export const dynamic = "force-dynamic";

function brokerOrAdminWhere(
  viewerId: string,
  role: string | undefined
): Prisma.LeadWhereInput {
  if (role === "ADMIN") return {};
  return {
    OR: [
      { introducedByBrokerId: viewerId },
      { lastFollowUpByBrokerId: viewerId },
      { leadSource: "evaluation_lead" },
      { leadSource: "broker_consultation" },
    ],
  };
}

/** Dashboard KPIs for CRM (broker/admin). */
export async function GET() {
  const viewerId = await getGuestId();
  if (!viewerId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  if (viewer?.role !== "ADMIN" && viewer?.role !== "BROKER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const base = brokerOrAdminWhere(viewerId, viewer.role);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday.getTime() + 86400000);
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const idRows = await prisma.lead.findMany({
    where: base,
    select: { id: true },
    take: 5000,
  });
  const ids = idRows.map((r) => r.id);

  const activePipelineWhere = {
    ...base,
    pipelineStatus: { notIn: ["won", "lost", "closed"] },
  } satisfies Prisma.LeadWhereInput;

  const [
    total,
    hot,
    newLeads,
    won,
    dueToday,
    overdue,
    consultRequests,
    openPipeline,
    aggOpen,
    aggWon,
    toCall,
    recentLeads,
    hotSample,
    meetingsToday,
    dmNewToMessageCount,
    dmFollowUpDueCount,
    dmNewSample,
    dmFollowUpSample,
    urgentLeads,
    newLeadsTodayCount,
    hotLast7,
    hotPrev7,
    topSourceRows,
    highValueNewNoContact,
    followUpsStale,
    pipelineStageRows,
    hotNotContacted10m,
    qualifiedNoMeeting,
    closingStale48h,
    lostCount,
    avgFirstContactSample,
    closingStageSample,
    inNegotiationCount,
  ] = await Promise.all([
    prisma.lead.count({ where: base }),
    prisma.lead.count({ where: { ...base, score: { gte: 80 } } }),
    prisma.lead.count({ where: { ...base, pipelineStatus: "new" } }),
    prisma.lead.count({ where: { ...base, pipelineStatus: "won" } }),
    prisma.lead.count({
      where: {
        ...base,
        nextFollowUpAt: {
          gte: startOfToday,
          lt: endOfToday,
        },
      },
    }),
    prisma.lead.count({
      where: {
        ...base,
        nextFollowUpAt: { lt: startOfToday },
        pipelineStatus: { notIn: ["won", "lost", "closed"] },
      },
    }),
    ids.length === 0
      ? 0
      : prisma.leadTimelineEvent.count({
          where: {
            eventType: "consultation_requested",
            leadId: { in: ids },
          },
        }),
    prisma.lead.count({ where: activePipelineWhere }),
    prisma.lead.aggregate({
      where: activePipelineWhere,
      _sum: { commissionEstimate: true, dealValue: true },
    }),
    prisma.lead.aggregate({
      where: { ...base, pipelineStatus: "won" },
      _avg: { finalSalePrice: true },
      _sum: { finalCommission: true },
    }),
    prisma.lead.findMany({
      where: {
        ...base,
        pipelineStatus: { notIn: ["won", "lost", "closed"] },
        OR: [
          { nextFollowUpAt: { lt: now } },
          { nextActionAt: { lt: now } },
        ],
      },
      orderBy: [{ nextFollowUpAt: "asc" }, { score: "desc" }],
      take: 12,
      select: {
        id: true,
        name: true,
        score: true,
        nextFollowUpAt: true,
        nextActionAt: true,
        pipelineStatus: true,
        dealValue: true,
        phone: true,
      },
    }),
    prisma.lead.findMany({
      where: base,
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, score: true, createdAt: true, pipelineStatus: true },
    }),
    prisma.lead.findMany({
      where: { ...base, score: { gte: 80 }, pipelineStatus: { notIn: ["won", "lost", "closed"] } },
      orderBy: { score: "desc" },
      take: 8,
      select: { id: true, name: true, score: true, dealValue: true, pipelineStatus: true },
    }),
    prisma.lead.findMany({
      where: {
        ...base,
        meetingAt: {
          gte: startOfToday,
          lt: endOfToday,
        },
        pipelineStatus: { notIn: ["lost"] },
      },
      orderBy: { meetingAt: "asc" },
      take: 20,
      select: { id: true, name: true, meetingAt: true, score: true },
    }),
    prisma.lead.count({
      where: {
        ...activePipelineWhere,
        dmStatus: "none",
      },
    }),
    prisma.lead.count({
      where: {
        ...activePipelineWhere,
        dmStatus: "sent",
        lastDmAt: { lt: twentyFourHoursAgo },
      },
    }),
    prisma.lead.findMany({
      where: { ...activePipelineWhere, dmStatus: "none" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true },
    }),
    prisma.lead.findMany({
      where: {
        ...activePipelineWhere,
        dmStatus: "sent",
        lastDmAt: { lt: twentyFourHoursAgo },
      },
      orderBy: { lastDmAt: "asc" },
      take: 6,
      select: { id: true, name: true, lastDmAt: true },
    }),
    prisma.lead.findMany({
      where: {
        ...activePipelineWhere,
        OR: [
          {
            pipelineStatus: "new",
            createdAt: { lt: twentyFourHoursAgo },
            OR: [{ lastContactedAt: null }, { lastContactedAt: { lt: twentyFourHoursAgo } }],
          },
          {
            highIntent: true,
            dmStatus: "none",
          },
          {
            score: { gte: 85 },
            lastContactedAt: null,
            pipelineStatus: { notIn: ["won", "lost", "closed"] },
          },
          {
            nextFollowUpAt: { lt: seventyTwoHoursAgo },
            reminderStatus: "pending",
          },
        ],
      },
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      take: 15,
      select: {
        id: true,
        name: true,
        score: true,
        pipelineStatus: true,
        createdAt: true,
        leadSource: true,
        dealValue: true,
      },
    }),
    prisma.lead.count({
      where: { ...base, createdAt: { gte: startOfToday, lt: endOfToday } },
    }),
    prisma.lead.count({
      where: { ...base, score: { gte: 80 }, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.lead.count({
      where: {
        ...base,
        score: { gte: 80 },
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    }),
    prisma.lead.groupBy({
      by: ["source"],
      where: { ...base, createdAt: { gte: thirtyDaysAgo } },
      _count: { _all: true },
      orderBy: { _count: { source: "desc" } },
      take: 8,
    }),
    prisma.lead.count({
      where: {
        ...base,
        pipelineStatus: "new",
        dealValue: { gte: 750_000 },
        OR: [{ lastContactedAt: null }, { lastContactedAt: { lt: twentyFourHoursAgo } }],
      },
    }),
    prisma.lead.count({
      where: {
        ...base,
        pipelineStatus: { notIn: ["won", "lost", "closed"] },
        lastFollowUpAt: { lt: seventyTwoHoursAgo },
      },
    }),
    prisma.lead.groupBy({
      by: ["pipelineStatus"],
      where: base,
      _count: { _all: true },
    }),
    prisma.lead.count({
      where: {
        ...base,
        score: { gte: 80 },
        pipelineStatus: "new",
        createdAt: { lt: tenMinAgo },
        firstContactAt: null,
        lastContactedAt: null,
      },
    }),
    prisma.lead.count({
      where: {
        ...base,
        pipelineStatus: "qualified",
        meetingAt: null,
      },
    }),
    prisma.lead.count({
      where: {
        ...base,
        pipelineStatus: { in: ["negotiation", "closing"] },
        OR: [{ lastContactedAt: { lt: fortyEightHoursAgo } }, { lastContactedAt: null }],
      },
    }),
    prisma.lead.count({ where: { ...base, pipelineStatus: "lost" } }),
    prisma.lead.findMany({
      where: { ...base, firstContactAt: { not: null } },
      select: { createdAt: true, firstContactAt: true },
      take: 500,
    }),
    prisma.lead.findMany({
      where: { ...base, pipelineStatus: { in: ["negotiation", "closing"] } },
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      take: 10,
      select: { id: true, name: true, score: true, pipelineStatus: true },
    }),
    prisma.lead.count({
      where: { ...base, pipelineStatus: { in: ["negotiation", "closing"] } },
    }),
  ]);

  const touchpointsLast7d =
    ids.length === 0
      ? 0
      : await prisma.leadFollowUp.count({
          where: {
            leadId: { in: ids },
            createdAt: { gte: sevenDaysAgo },
          },
        });

  const conversionRate = total > 0 ? Math.round((won / total) * 1000) / 10 : 0;

  const insights: string[] = [];
  if (hotLast7 > hotPrev7) {
    insights.push("Hot leads increasing — last 7 days ahead of the prior week.");
  }
  const topSrc = topSourceRows[0];
  const topCount = topSrc?._count?._all ?? 0;
  if (topSrc && topCount > 0) {
    const label =
      topSrc.source && topSrc.source.trim()
        ? topSrc.source
        : topSrc.source === null || topSrc.source === ""
          ? "direct / unset"
          : String(topSrc.source);
    if (label.toLowerCase().includes("facebook")) {
      insights.push("Facebook-attributed leads are a top volume driver (last 30 days).");
    } else {
      insights.push(`Top acquisition source (30d): ${label} (${topCount} leads).`);
    }
  }
  if (highValueNewNoContact > 0) {
    insights.push(`${highValueNewNoContact} high-value lead(s) not yet contacted within 24h.`);
  }
  if (followUpsStale > 0) {
    insights.push(`${followUpsStale} lead(s) with no follow-up logged in 3+ days.`);
  }

  const brokerNotifications: string[] = [];
  if (newLeadsTodayCount > 0) {
    brokerNotifications.push(`${newLeadsTodayCount} new lead(s) arrived today.`);
  }
  if (urgentLeads.length > 0) {
    brokerNotifications.push(`${urgentLeads.length} urgent lead(s) — SLA or intent risk.`);
  }
  if (overdue > 0) {
    brokerNotifications.push(`${overdue} follow-up(s) are overdue.`);
  }
  if (hot >= 3 && dmNewToMessageCount > 0) {
    brokerNotifications.push(`High intent backlog: ${dmNewToMessageCount} DM(s) to send.`);
  }
  if (hotNotContacted10m > 0) {
    brokerNotifications.push(`${hotNotContacted10m} hot lead(s) not contacted within 10 minutes.`);
  }
  if (qualifiedNoMeeting > 0) {
    brokerNotifications.push(`${qualifiedNoMeeting} qualified lead(s) with no meeting booked.`);
  }
  if (closingStale48h > 0) {
    brokerNotifications.push(`${closingStale48h} negotiation/closing lead(s) inactive 48h+.`);
  }
  const pipelineBrokerCommission = aggOpen._sum.commissionEstimate ?? 0;
  const pipelineDealValue = aggOpen._sum.dealValue ?? 0;
  const wonBrokerCommission = aggWon._sum.finalCommission ?? 0;
  const avgDealSize =
    aggWon._avg.finalSalePrice != null ? Math.round(aggWon._avg.finalSalePrice) : 0;
  /** Reference only — BNHub / stays are billed separately in finance modules. */
  const platformBnhubReferenceCut = Math.round(pipelineDealValue * PLATFORM_BNHUB_HOST_FEE_RATE);

  const leadsByStage: Record<string, number> = {};
  for (const row of pipelineStageRows) {
    const key = normalizePipelineStage(row.pipelineStatus ?? "new");
    leadsByStage[key] = (leadsByStage[key] ?? 0) + row._count._all;
  }
  let sumFirstMs = 0;
  let firstN = 0;
  for (const row of avgFirstContactSample) {
    if (row.firstContactAt) {
      sumFirstMs += row.firstContactAt.getTime() - row.createdAt.getTime();
      firstN++;
    }
  }
  const avgFirstResponseMinutes = firstN > 0 ? Math.round(sumFirstMs / firstN / 60000) : null;
  const winRateClosed =
    won + lostCount > 0 ? Math.round((won / (won + lostCount)) * 1000) / 10 : 0;

  return NextResponse.json({
    total,
    hotLeads: hot,
    newLeads,
    wonLeads: won,
    openPipelineCount: openPipeline,
    consultationsRequested: consultRequests,
    conversionRate,
    followUpsDueToday: dueToday,
    overdueFollowUps: overdue,
    pipelineBrokerCommission,
    pipelineDealValueSum: pipelineDealValue,
    wonBrokerCommission,
    avgDealSizeWon: avgDealSize,
    totalRevenueReference: pipelineBrokerCommission + wonBrokerCommission,
    platformBnhubHostFeeReference: platformBnhubReferenceCut,
    closingPerformance: {
      leadsByStage,
      avgFirstResponseMinutes,
      meetingsBooked: meetingsToday.length,
      dealsWon: won,
      dealsLost: lostCount,
      winRate: winRateClosed,
      overdueFollowUps: overdue,
      hotLeadsNotContacted10m: hotNotContacted10m,
      qualifiedNoMeeting,
      closingInactive48h: closingStale48h,
      inNegotiationOrClosing: inNegotiationCount,
    },
    automation: {
      urgentLeads: urgentLeads.map((l) => ({
        id: l.id,
        name: l.name,
        score: l.score,
        pipelineStatus: l.pipelineStatus,
        leadSource: l.leadSource,
        dealValue: l.dealValue,
        createdAt: l.createdAt.toISOString(),
      })),
      insights,
      dailySummary: {
        newLeadsToday: newLeadsTodayCount,
        callsNeeded: urgentLeads.length,
        hotLeads: hot,
        followUpsOverdue: overdue,
      },
      brokerNotifications,
      performance: {
        conversionRate,
        revenueReference: pipelineBrokerCommission + wonBrokerCommission,
        touchpointsLogged7d: touchpointsLast7d,
        meetingsToday: meetingsToday.length,
        wonDeals: won,
      },
    },
    dmActions: {
      newToMessage: dmNewToMessageCount,
      followUpsDue: dmFollowUpDueCount,
      newSample: dmNewSample,
      followUpSample: dmFollowUpSample.map((l) => ({
        id: l.id,
        name: l.name,
        lastDmAt: l.lastDmAt?.toISOString() ?? null,
      })),
    },
    todaysPriorities: {
      leadsToCall: toCall.map((l) => ({
        id: l.id,
        name: l.name,
        score: l.score,
        nextFollowUpAt: l.nextFollowUpAt,
        nextActionAt: l.nextActionAt,
        dealValue: l.dealValue,
        phone: l.phone,
      })),
      followUpsDueToday: dueToday,
      overdueLeads: overdue,
      hotLeadsSample: hotSample,
      recentLeads,
      meetingsToday: meetingsToday.map((m) => ({
        id: m.id,
        name: m.name,
        meetingAt: m.meetingAt,
        score: m.score,
      })),
      closingStageLeads: closingStageSample.map((l) => ({
        id: l.id,
        name: l.name,
        score: l.score,
        pipelineStatus: l.pipelineStatus,
      })),
      urgentLeadCount: urgentLeads.length,
    },
  });
}
