/**
 * Product insights engine — aggregates UserEvent, UserFeedback, InvestmentDeal, and User engagement.
 * No external analytics; DB-only, lightweight.
 */
import { Prisma } from "@prisma/client";
import { UserEventType } from "@prisma/client";
import { prisma } from "@/lib/db";

const CHART_DAYS = 14;
/** Traffic funnel window (TrafficEvent) */
const FUNNEL_DAYS = 30;

const FEATURE_TYPES = [
  UserEventType.ANALYZE,
  UserEventType.SAVE_DEAL,
  UserEventType.COMPARE,
] as const;

const FEATURE_LABEL: Record<(typeof FEATURE_TYPES)[number], string> = {
  [UserEventType.ANALYZE]: "Analyze",
  [UserEventType.SAVE_DEAL]: "Save deal",
  [UserEventType.COMPARE]: "Compare",
};

export type ProductInsightsEngineSnapshot = {
  /** All-time registered users */
  totalUsers: number;
  /** UserEvent rows: ANALYZE (funnel “analyses”) */
  totalAnalyses: number;
  /** InvestmentDeal rows persisted */
  totalSavedDeals: number;
  /** UserEvent SAVE_DEAL (includes demo saves mirrored from traffic) */
  totalSaveEvents: number;
  /** Sum of User.investmentMvpAnalyzeCount (logged-in server-tracked) */
  serverTrackedAnalyses: number;
  /** InvestmentDeal count ÷ ANALYZE events (savedDeals / analyses) */
  analyzeToSaveRate: number | null;
  /** SAVE_DEAL events ÷ ANALYZE events (includes demo saves in events) */
  eventFunnelConversionPct: number | null;
  /** InvestmentDeal count ÷ totalUsers */
  avgDealsPerUser: number;
  /** UserFeedback rows */
  feedbackCount: number;
  /** Feedback in last 30 days (for “low feedback” signal) */
  feedbackLast30Days: number;
  mostUsedFeature: string | null;
  leastUsedFeature: string | null;
  featureCounts: Record<string, number>;
  /** Rule-based recommendations */
  automatedInsights: string[];
  recentFeedback: Array<{
    id: string;
    message: string | null;
    rating: number | null;
    createdAt: string;
  }>;
  mostActiveUsers: Array<{
    email: string;
    investmentMvpAnalyzeCount: number;
    savedDeals: number;
  }>;
  charts: {
    analysesPerDay: Array<{ day: string; count: number }>;
    savesPerDay: Array<{ day: string; count: number }>;
  };
  chartDays: typeof CHART_DAYS;
  /** Last 30d — TrafficEvent-based acquisition funnel */
  funnel30d: {
    days: typeof FUNNEL_DAYS;
    homeSessions: number;
    analyzeCtaClicks: number;
    analyzeRuns: number;
    saves: number;
    dashboardVisits: number;
    /** Stage with lowest conversion vs previous (biggest relative drop) */
    biggestDropLabel: string | null;
    biggestDropPct: number | null;
    microFeedbackYes: number;
    microFeedbackNo: number;
  };
  /** Organic growth / sharing (last 30d) */
  growth30d: {
    days: typeof FUNNEL_DAYS;
    shareDealClicks: number;
    shareCopyAfterAnalysis: number;
    sharedDealPageVisitsRecorded: number;
    sharedDealVisitsWithReferrer: number;
    /** Proxy: analyze runs where URL or meta indicates utm_source=share */
    analyzeRunsFromShareAttribution: number;
    /** Free plan save blocked (traffic) */
    planLimitHits: number;
    /** Upgrade CTA clicks (mock funnel) */
    upgradeClicks: number;
  };
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function fillLastDays(
  rows: Array<{ day: Date | string; c: bigint | number }>,
  days: number
): Array<{ day: string; count: number }> {
  const map = new Map<string, number>();
  for (const r of rows) {
    const d = typeof r.day === "string" ? r.day : r.day.toISOString().slice(0, 10);
    map.set(d, Number(r.c));
  }
  const out: Array<{ day: string; count: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date();
    dt.setHours(0, 0, 0, 0);
    dt.setDate(dt.getDate() - i);
    const key = dt.toISOString().slice(0, 10);
    out.push({ day: key, count: map.get(key) ?? 0 });
  }
  return out;
}

function computeFunnelDropStages(input: {
  homeSessions: number;
  analyzeCtaClicks: number;
  analyzeRuns: number;
  saves: number;
  dashboardVisits: number;
}): { biggestDropLabel: string | null; biggestDropPct: number | null } {
  const h = input.homeSessions;
  const c = input.analyzeCtaClicks;
  const r = input.analyzeRuns;
  const s = input.saves;
  const d = input.dashboardVisits;

  type Stage = { label: string; dropPct: number };
  const stages: Stage[] = [];
  if (h > 0) stages.push({ label: "Home visit → Analyze CTA", dropPct: (1 - Math.min(c, h) / h) * 100 });
  if (c > 0) stages.push({ label: "Analyze CTA → Run analysis", dropPct: (1 - Math.min(r, c) / c) * 100 });
  if (r > 0) stages.push({ label: "Run analysis → Save deal", dropPct: (1 - Math.min(s, r) / r) * 100 });
  if (s > 0) stages.push({ label: "Save deal → Dashboard visit", dropPct: (1 - Math.min(d, s) / s) * 100 });
  if (stages.length === 0) return { biggestDropLabel: null, biggestDropPct: null };
  const worst = stages.reduce((a, b) => (b.dropPct > a.dropPct ? b : a));
  return { biggestDropLabel: worst.label, biggestDropPct: round1(worst.dropPct) };
}

function buildAutomatedInsights(input: {
  analyzeEvents: number;
  eventFunnelPct: number | null;
  avgDealsPerUser: number;
  totalUsers: number;
  feedbackCount: number;
  feedbackLast30: number;
}): string[] {
  const lines: string[] = [];
  const { analyzeEvents, eventFunnelPct, avgDealsPerUser, totalUsers, feedbackCount, feedbackLast30 } = input;

  if (analyzeEvents >= 5 && eventFunnelPct != null && eventFunnelPct < 30) {
    lines.push("Users analyze but don’t save → improve save CTA or clarity");
  }
  if (totalUsers >= 3 && avgDealsPerUser < 2) {
    lines.push("Users not returning → improve retention and re-engagement");
  }
  const feedbackLow = feedbackCount < 5 || feedbackLast30 < 3;
  if (analyzeEvents >= 5 && feedbackLow) {
    lines.push("Users not giving feedback → improve feedback visibility");
  }
  return lines;
}

export async function getProductInsightsEngineSnapshot(): Promise<ProductInsightsEngineSnapshot> {
  const sinceChart = new Date(Date.now() - CHART_DAYS * 86_400_000);
  const since30 = new Date(Date.now() - 30 * 86_400_000);

  const [
    totalUsers,
    analyzeEvents,
    saveEvents,
    totalSavedDeals,
    sumMvp,
    feedbackCount,
    feedbackLast30Days,
    feedbackRows,
    groupedFeatures,
    topUsers,
    dailyAnalyze,
    dailySaves,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.userEvent.count({ where: { eventType: UserEventType.ANALYZE } }),
    prisma.userEvent.count({ where: { eventType: UserEventType.SAVE_DEAL } }),
    prisma.investmentDeal.count(),
    prisma.user.aggregate({ _sum: { investmentMvpAnalyzeCount: true } }),
    prisma.userFeedback.count(),
    prisma.userFeedback.count({ where: { createdAt: { gte: since30 } } }),
    prisma.userFeedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, message: true, rating: true, createdAt: true },
    }),
    prisma.userEvent.groupBy({
      by: ["eventType"],
      _count: true,
    }),
    prisma.user.findMany({
      orderBy: [{ investmentMvpAnalyzeCount: "desc" }, { updatedAt: "desc" }],
      take: 15,
      select: {
        email: true,
        investmentMvpAnalyzeCount: true,
        _count: { select: { investmentDeals: true } },
      },
    }),
    prisma.$queryRaw<Array<{ day: Date; c: bigint }>>(
      Prisma.sql`
        SELECT date_trunc('day', "created_at")::date AS day, COUNT(*)::bigint AS c
        FROM "user_events"
        WHERE "eventType"::text = 'ANALYZE'
          AND "created_at" >= ${sinceChart}
        GROUP BY 1
        ORDER BY 1 ASC
      `
    ),
    prisma.$queryRaw<Array<{ day: Date; c: bigint }>>(
      Prisma.sql`
        SELECT date_trunc('day', "created_at")::date AS day, COUNT(*)::bigint AS c
        FROM "investment_deals"
        WHERE "created_at" >= ${sinceChart}
        GROUP BY 1
        ORDER BY 1 ASC
      `
    ),
  ]);

  const funnelSince = new Date(Date.now() - FUNNEL_DAYS * 86_400_000);

  const [funnelHomeRows, funnelCtaRows, funnelRunRows, funnelSaveTraffic, funnelDashTraffic, funnelMicroRows] =
    await Promise.all([
      prisma.$queryRaw<Array<{ c: bigint }>>(
        Prisma.sql`
          SELECT COUNT(DISTINCT COALESCE(session_id, id::text))::bigint AS c
          FROM traffic_events
          WHERE created_at >= ${funnelSince}
            AND event_type = 'page_view'
            AND (path = '/' OR path LIKE '/?%')
        `
      ),
      prisma.$queryRaw<Array<{ c: bigint }>>(
        Prisma.sql`
          SELECT COUNT(*)::bigint AS c
          FROM traffic_events
          WHERE created_at >= ${funnelSince}
            AND (
              event_type = 'investment_analyze_cta_click'
              OR (event_type = 'investment_analyze_click' AND (meta->>'ctaKind') IS NOT NULL)
            )
        `
      ),
      prisma.$queryRaw<Array<{ c: bigint }>>(
        Prisma.sql`
          SELECT COUNT(*)::bigint AS c
          FROM traffic_events
          WHERE created_at >= ${funnelSince}
            AND (
              event_type = 'investment_analyze_run'
              OR (
                event_type = 'investment_analyze_click'
                AND (meta->>'ctaKind') IS NULL
                AND ((meta->>'city') IS NOT NULL OR (meta->>'mode') IS NOT NULL)
              )
            )
        `
      ),
      prisma.trafficEvent.count({
        where: { eventType: "investment_deal_saved", createdAt: { gte: funnelSince } },
      }),
      prisma.trafficEvent.count({
        where: { eventType: "investment_dashboard_visit", createdAt: { gte: funnelSince } },
      }),
      prisma.$queryRaw<Array<{ yes: bigint; no: bigint }>>(
        Prisma.sql`
          SELECT
            COUNT(*) FILTER (WHERE meta->>'helpful' = 'true')::bigint AS yes,
            COUNT(*) FILTER (WHERE meta->>'helpful' = 'false')::bigint AS no
          FROM traffic_events
          WHERE created_at >= ${funnelSince}
            AND event_type = 'micro_feedback_helpful'
        `
      ),
    ]);

  const funnelHome = Number(funnelHomeRows[0]?.c ?? 0);
  const funnelCta = Number(funnelCtaRows[0]?.c ?? 0);
  const funnelRun = Number(funnelRunRows[0]?.c ?? 0);
  const funnelSave = funnelSaveTraffic;
  const funnelDash = funnelDashTraffic;
  const microYes = Number(funnelMicroRows[0]?.yes ?? 0);
  const microNo = Number(funnelMicroRows[0]?.no ?? 0);

  const funnelDrop = computeFunnelDropStages({
    homeSessions: funnelHome,
    analyzeCtaClicks: funnelCta,
    analyzeRuns: funnelRun,
    saves: funnelSave,
    dashboardVisits: funnelDash,
  });

  const [
    shareDealClicks,
    shareCopyAfterAnalysis,
    sharedDealPageVisitsRecorded,
    sharedDealVisitsWithReferrer,
    analyzeShareAttrRows,
    planLimitHits,
    upgradeClicks,
  ] = await Promise.all([
    prisma.trafficEvent.count({
      where: { eventType: "share_deal_clicked", createdAt: { gte: funnelSince } },
    }),
    prisma.trafficEvent.count({
      where: { eventType: "investment_share_copy_after_analysis", createdAt: { gte: funnelSince } },
    }),
    prisma.sharedDealVisit.count({ where: { createdAt: { gte: funnelSince } } }),
    prisma.sharedDealVisit.count({
      where: {
        createdAt: { gte: funnelSince },
        OR: [{ referrerDealId: { not: null } }, { referrerUserId: { not: null } }],
      },
    }),
    prisma.$queryRaw<Array<{ c: bigint }>>(
      Prisma.sql`
        SELECT COUNT(*)::bigint AS c
        FROM traffic_events
        WHERE created_at >= ${funnelSince}
          AND event_type = 'investment_analyze_run'
          AND (
            path ILIKE '%utm_source=share%'
            OR (meta->>'utm_source') = 'share'
          )
      `
    ),
    prisma.trafficEvent.count({
      where: { eventType: "investment_plan_limit_hit", createdAt: { gte: funnelSince } },
    }),
    prisma.trafficEvent.count({
      where: { eventType: "investment_upgrade_click", createdAt: { gte: funnelSince } },
    }),
  ]);

  const analyzeRunsFromShareAttribution = Number(analyzeShareAttrRows[0]?.c ?? 0);

  const featureCounts: Record<string, number> = {};
  for (const t of FEATURE_TYPES) {
    const row = groupedFeatures.find((g) => g.eventType === t);
    featureCounts[FEATURE_LABEL[t]] = row?._count ?? 0;
  }

  let mostUsedFeature: string | null = null;
  let leastUsedFeature: string | null = null;
  let max = -1;
  let min = Number.POSITIVE_INFINITY;
  for (const t of FEATURE_TYPES) {
    const label = FEATURE_LABEL[t];
    const c = featureCounts[label] ?? 0;
    if (c > max) {
      max = c;
      mostUsedFeature = label;
    }
    if (c < min) {
      min = c;
      leastUsedFeature = label;
    }
  }
  if (max <= 0) {
    mostUsedFeature = null;
    leastUsedFeature = null;
  }

  const serverTrackedAnalyses = sumMvp._sum.investmentMvpAnalyzeCount ?? 0;

  const eventFunnelConversionPct =
    analyzeEvents > 0 ? round1((saveEvents / analyzeEvents) * 100) : null;

  const analyzeToSaveRate =
    analyzeEvents > 0 ? round1((totalSavedDeals / analyzeEvents) * 100) : null;

  const avgDealsPerUser = totalUsers > 0 ? round1(totalSavedDeals / totalUsers) : 0;

  const automatedInsightsBase = buildAutomatedInsights({
    analyzeEvents,
    eventFunnelPct: eventFunnelConversionPct,
    avgDealsPerUser,
    totalUsers,
    feedbackCount,
    feedbackLast30: feedbackLast30Days,
  });

  const automatedInsights = [...automatedInsightsBase];
  if (
    funnelDrop.biggestDropPct != null &&
    funnelDrop.biggestDropLabel &&
    funnelDrop.biggestDropPct >= 35 &&
    funnelRun >= 5
  ) {
    automatedInsights.unshift(
      `Biggest funnel drop (${FUNNEL_DAYS}d): ${funnelDrop.biggestDropLabel} — ${funnelDrop.biggestDropPct}% loss`
    );
  }

  return {
    totalUsers,
    totalAnalyses: analyzeEvents,
    totalSavedDeals,
    totalSaveEvents: saveEvents,
    serverTrackedAnalyses,
    analyzeToSaveRate,
    eventFunnelConversionPct,
    avgDealsPerUser,
    feedbackCount,
    feedbackLast30Days,
    mostUsedFeature,
    leastUsedFeature,
    featureCounts,
    automatedInsights,
    recentFeedback: feedbackRows.map((f) => ({
      id: f.id,
      message: f.message,
      rating: f.rating,
      createdAt: f.createdAt.toISOString(),
    })),
    mostActiveUsers: topUsers.map((u) => ({
      email: u.email,
      investmentMvpAnalyzeCount: u.investmentMvpAnalyzeCount,
      savedDeals: u._count.investmentDeals,
    })),
    charts: {
      analysesPerDay: fillLastDays(dailyAnalyze, CHART_DAYS),
      savesPerDay: fillLastDays(dailySaves, CHART_DAYS),
    },
    chartDays: CHART_DAYS,
    funnel30d: {
      days: FUNNEL_DAYS,
      homeSessions: funnelHome,
      analyzeCtaClicks: funnelCta,
      analyzeRuns: funnelRun,
      saves: funnelSave,
      dashboardVisits: funnelDash,
      biggestDropLabel: funnelDrop.biggestDropLabel,
      biggestDropPct: funnelDrop.biggestDropPct,
      microFeedbackYes: microYes,
      microFeedbackNo: microNo,
    },
    growth30d: {
      days: FUNNEL_DAYS,
      shareDealClicks,
      shareCopyAfterAnalysis,
      sharedDealPageVisitsRecorded,
      sharedDealVisitsWithReferrer,
      analyzeRunsFromShareAttribution,
      planLimitHits,
      upgradeClicks,
    },
  };
}
