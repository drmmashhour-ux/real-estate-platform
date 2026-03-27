import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { extractLeadCity } from "@/lib/leads/timeline-helpers";

export const dynamic = "force-dynamic";

function pct(num: number, den: number): number {
  if (den <= 0) return 0;
  return Math.round((num / den) * 1000) / 10;
}

export async function GET(req: NextRequest) {
  const viewerId = await getGuestId();
  if (!viewerId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  if (viewer?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const days = Math.min(365, Math.max(7, parseInt(req.nextUrl.searchParams.get("days") ?? "30", 10) || 30));
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [
    leadsBySource,
    wonBySource,
    leadsByCampaignRaw,
    wonByCampaign,
    topPages,
    ctaBreakdown,
    eventCounts,
    distinctVisitorsRows,
    funnelSessionsPending,
    retargetUsers,
    marketingRow,
    evalLeadsForCity,
  ] = await Promise.all([
    prisma.lead.groupBy({
      by: ["source"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["source"],
      where: {
        createdAt: { gte: since },
        OR: [{ pipelineStatus: "won" }, { dealClosedAt: { not: null } }],
      },
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["campaign"],
      where: { createdAt: { gte: since }, campaign: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { campaign: "desc" } },
      take: 30,
    }),
    prisma.lead.groupBy({
      by: ["campaign"],
      where: {
        createdAt: { gte: since },
        campaign: { not: null },
        OR: [{ pipelineStatus: "won" }, { dealClosedAt: { not: null } }],
      },
      _count: { _all: true },
    }),
    prisma.trafficEvent.groupBy({
      by: ["path"],
      where: { eventType: "page_view", path: { not: null }, createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
      take: 15,
    }),
    prisma.trafficEvent.groupBy({
      by: ["eventType"],
      where: {
        eventType: { in: ["CTA_clicked", "call_clicked", "whatsapp_clicked"] },
        createdAt: { gte: since },
      },
      _count: { _all: true },
    }),
    prisma.trafficEvent.groupBy({
      by: ["eventType"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(DISTINCT session_id)::bigint AS n
      FROM traffic_events
      WHERE event_type = 'page_view'
        AND created_at >= ${since}
        AND session_id IS NOT NULL
    `,
    prisma.evaluateFunnelSession.count({
      where: { submittedAt: null, startedAt: { gte: since } },
    }),
    prisma.user.count({ where: { isRetargetCandidate: true } }),
    prisma.marketingSettings.findUnique({ where: { id: "default" } }),
    prisma.lead.findMany({
      where: { leadSource: "evaluation_lead", createdAt: { gte: since } },
      select: { aiExplanation: true, message: true, campaign: true },
    }),
  ]);

  const wonSrc = new Map<string | null, number>();
  for (const r of wonBySource) wonSrc.set(r.source, r._count._all);

  const leadsBySourceRows = leadsBySource
    .map((r) => {
      const total = r._count._all;
      const won = wonSrc.get(r.source) ?? 0;
      return {
        source: r.source ?? "(not tracked)",
        leads: total,
        won,
        conversionRatePct: pct(won, total),
      };
    })
    .sort((a, b) => b.leads - a.leads);

  const wonCamp = new Map<string | null, number>();
  for (const r of wonByCampaign) wonCamp.set(r.campaign, r._count._all);

  const leadsByCampaign = leadsByCampaignRaw
    .filter((r) => r.campaign)
    .map((r) => {
      const camp = r.campaign as string;
      const total = r._count._all;
      const won = wonCamp.get(camp) ?? 0;
      return {
        campaign: camp,
        leads: total,
        won,
        conversionRatePct: pct(won, total),
      };
    });

  let bestByLeads: string | null = null;
  let bestByConversion: { campaign: string; conversionRatePct: number } | null = null;
  if (leadsByCampaign.length > 0) {
    const byLeads = [...leadsByCampaign].sort((a, b) => b.leads - a.leads)[0];
    bestByLeads = byLeads?.campaign ?? null;
    const eligible = leadsByCampaign.filter((c) => c.leads >= 2);
    if (eligible.length > 0) {
      bestByConversion = eligible.reduce((a, b) =>
        b.conversionRatePct > a.conversionRatePct ? b : a
      );
    }
  }

  const evMap = Object.fromEntries(eventCounts.map((e) => [e.eventType, e._count._all]));
  const pageViews = evMap.page_view ?? 0;
  const evalSubmitted =
    (evMap.evaluation_submitted ?? 0) + (evMap.evaluation_submit ?? 0);
  const evalStarted = evMap.evaluation_started ?? 0;

  const totalLeadsPeriod = await prisma.lead.count({ where: { createdAt: { gte: since } } });
  const distinctVisitors = Number(
    distinctVisitorsRows[0]?.n ?? BigInt(0)
  );
  const manualAdSpendCad = marketingRow?.manualAdSpendCad ?? 0;
  const costPerLead =
    manualAdSpendCad > 0 && totalLeadsPeriod > 0
      ? Math.round((manualAdSpendCad / totalLeadsPeriod) * 100) / 100
      : null;

  const cityMap = new Map<string, number>();
  for (const l of evalLeadsForCity) {
    const city = extractLeadCity(l);
    if (!city) continue;
    const key = city.trim();
    if (!key) continue;
    cityMap.set(key, (cityMap.get(key) ?? 0) + 1);
  }
  const topCities = [...cityMap.entries()]
    .map(([city, leads]) => ({ city, leads }))
    .sort((a, b) => b.leads - a.leads);

  const mostVisitedPages = topPages
    .filter((p) => p.path)
    .map((p) => ({ path: p.path as string, views: p._count._all }));

  const mostClickedButtons = ctaBreakdown
    .map((c) => ({ eventType: c.eventType, clicks: c._count._all }))
    .sort((a, b) => b.clicks - a.clicks);

  return NextResponse.json({
    periodDays: days,
    since: since.toISOString(),
    totalVisitors: distinctVisitors,
    totalPageViews: pageViews,
    totalLeads: totalLeadsPeriod,
    leadConversionFromVisitorsPct: pct(totalLeadsPeriod, distinctVisitors),
    evaluationStarted: evalStarted,
    evaluationSubmitted: evalSubmitted,
    /** Primary funnel metric requested: submissions / page views */
    evalSubmittedPerPageViewPct: pct(evalSubmitted, pageViews),
    /** Alternative: submissions / evaluation_started sessions */
    evalSubmittedPerStartedPct: pct(evalSubmitted, evalStarted),
    manualAdSpendCad,
    costPerLeadCad: costPerLead,
    leadsBySource: leadsBySourceRows,
    leadsByCampaign,
    bestCampaignByLeads: bestByLeads,
    bestCampaignByConversion: bestByConversion,
    heat: {
      mostVisitedPages,
      mostClickedButtons,
    },
    retargeting: {
      anonymousSessionsEvaluateNoSubmit: funnelSessionsPending,
      usersMarkedRetargetCandidate: retargetUsers,
    },
    topCities,
    rawEventCounts: evMap,
  });
}
