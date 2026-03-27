import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";
import { DemoEvents } from "@/lib/demo-event-types";
import { demoSteps } from "@/lib/demo-steps";

export const dynamic = "force-dynamic";

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  if (process.env.NEXT_PUBLIC_ENV !== "staging") {
    return NextResponse.json({
      ok: true,
      message: "Demo analytics only collected when NEXT_PUBLIC_ENV=staging",
      totals: { users: 0, events: 0, sessionStarts: 0 },
      byEvent: [],
      last24h: [],
      blockedCount: 0,
      topListingViews: [],
      topSearchQueries: [],
      topBlockedRoutes: [],
      funnel: { view_listing: 0, contact_broker: 0, create_offer: 0 },
      guidedDemo: {
        startedUsers: 0,
        completedUsers: 0,
        completionRatePct: 0,
        dropOffStep: null as string | null,
        stepCounts: [] as { stepId: string; count: number }[],
      },
      dealAnalyzer: {
        runs: 0,
        completions: 0,
        avgScore: null as number | null,
        topListings: [] as { listingId: string; count: number }[],
      },
      mortgageSimulator: {
        used: 0,
        scenarioAdded: 0,
        scenarioCompared: 0,
      },
    });
  }

  const since = new Date(Date.now() - WINDOW_MS);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    userCount,
    eventCount,
    sessionStarts,
    blockedCount,
    byEventRows,
    recent,
    topListingViews,
    topSearchQueries,
    topBlockedRoutes,
    funnelRows,
    guidedStartedRows,
    guidedCompletedRows,
    demoStepBreakdown,
    dealAnalyzerUsedCount,
    dealAnalyzerCompletedCount,
    dealAnalyzerAvgScoreRow,
    topDealAnalyzerListings,
    mortgageSimulatorUsedCount,
    scenarioAddedCount,
    scenarioComparedCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.demoEvent.count(),
    prisma.demoEvent.count({ where: { event: DemoEvents.SESSION_START } }),
    prisma.demoEvent.count({ where: { event: DemoEvents.BLOCKED_ACTION } }),
    prisma.$queryRawUnsafe<Array<{ event: string; count: number }>>(
      `SELECT "event", COUNT(*)::int AS count FROM "demo_events" GROUP BY "event" ORDER BY count DESC LIMIT 60`
    ),
    prisma.demoEvent.findMany({
      where: { createdAt: { gte: since24h } },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, event: true, metadata: true, userId: true, createdAt: true },
    }),
    prisma.$queryRaw<
      Array<{ listingId: string; count: bigint }>
    >(Prisma.sql`
      SELECT COALESCE(metadata->>'listingId', '') AS "listingId", COUNT(*)::bigint AS count
      FROM "demo_events"
      WHERE "event" = ${DemoEvents.VIEW_LISTING}
        AND "created_at" >= ${since}
        AND metadata->>'listingId' IS NOT NULL
        AND metadata->>'listingId' != ''
      GROUP BY metadata->>'listingId'
      ORDER BY count DESC
      LIMIT 20
    `),
    prisma.$queryRaw<
      Array<{ q: string; count: bigint }>
    >(Prisma.sql`
      SELECT COALESCE(metadata->>'query', '') AS q, COUNT(*)::bigint AS count
      FROM "demo_events"
      WHERE "event" = ${DemoEvents.SEARCH}
        AND "created_at" >= ${since}
        AND metadata->>'query' IS NOT NULL
        AND metadata->>'query' != ''
      GROUP BY metadata->>'query'
      ORDER BY count DESC
      LIMIT 20
    `),
    prisma.$queryRaw<
      Array<{ route: string; count: bigint }>
    >(Prisma.sql`
      SELECT COALESCE(metadata->>'path', metadata->>'route', '') AS route, COUNT(*)::bigint AS count
      FROM "demo_events"
      WHERE "event" = ${DemoEvents.BLOCKED_ACTION}
        AND "created_at" >= ${since}
      GROUP BY COALESCE(metadata->>'path', metadata->>'route', '')
      HAVING COALESCE(metadata->>'path', metadata->>'route', '') != ''
      ORDER BY count DESC
      LIMIT 20
    `),
    prisma.$queryRaw<
      Array<{ event: string; count: bigint }>
    >(Prisma.sql`
      SELECT "event", COUNT(*)::bigint AS count
      FROM "demo_events"
      WHERE "event" IN (${Prisma.sql`${DemoEvents.VIEW_LISTING}`}, ${Prisma.sql`${DemoEvents.CONTACT_BROKER}`}, ${Prisma.sql`${DemoEvents.CREATE_OFFER}`})
        AND "created_at" >= ${since}
      GROUP BY "event"
    `),
    prisma.$queryRaw<Array<{ c: bigint }>>(
      Prisma.sql`
        SELECT COUNT(DISTINCT user_id)::bigint AS c
        FROM "demo_events"
        WHERE "event" = ${DemoEvents.DEMO_STEP}
          AND "created_at" >= ${since}
          AND user_id IS NOT NULL
      `
    ),
    prisma.$queryRaw<Array<{ c: bigint }>>(
      Prisma.sql`
        SELECT COUNT(DISTINCT user_id)::bigint AS c
        FROM "demo_events"
        WHERE "event" = ${DemoEvents.DEMO_COMPLETED}
          AND "created_at" >= ${since}
          AND user_id IS NOT NULL
      `
    ),
    prisma.$queryRaw<Array<{ stepId: string; count: bigint }>>(
      Prisma.sql`
        SELECT COALESCE(metadata->>'stepId', '') AS "stepId", COUNT(*)::bigint AS count
        FROM "demo_events"
        WHERE "event" = ${DemoEvents.DEMO_STEP}
          AND "created_at" >= ${since}
        GROUP BY metadata->>'stepId'
      `
    ),
    prisma.demoEvent.count({
      where: { event: DemoEvents.AI_DEAL_ANALYZER_USED, createdAt: { gte: since } },
    }),
    prisma.demoEvent.count({
      where: { event: DemoEvents.AI_DEAL_ANALYZER_COMPLETED, createdAt: { gte: since } },
    }),
    prisma.$queryRaw<Array<{ avg: number | null }>>(
      Prisma.sql`
        SELECT AVG((metadata->>'score')::double precision) AS avg
        FROM "demo_events"
        WHERE "event" = ${DemoEvents.AI_DEAL_ANALYZER_COMPLETED}
          AND "created_at" >= ${since}
          AND metadata->>'score' IS NOT NULL
      `
    ),
    prisma.$queryRaw<
      Array<{ listingId: string; count: bigint }>
    >(Prisma.sql`
      SELECT COALESCE(metadata->>'listingId', '') AS "listingId", COUNT(*)::bigint AS count
      FROM "demo_events"
      WHERE "event" = ${DemoEvents.AI_DEAL_ANALYZER_COMPLETED}
        AND "created_at" >= ${since}
        AND metadata->>'listingId' IS NOT NULL
        AND metadata->>'listingId' != ''
      GROUP BY metadata->>'listingId'
      ORDER BY count DESC
      LIMIT 15
    `),
    prisma.demoEvent.count({
      where: { event: DemoEvents.MORTGAGE_SIMULATOR_USED, createdAt: { gte: since } },
    }),
    prisma.demoEvent.count({
      where: { event: DemoEvents.SCENARIO_ADDED, createdAt: { gte: since } },
    }),
    prisma.demoEvent.count({
      where: { event: DemoEvents.SCENARIO_COMPARED, createdAt: { gte: since } },
    }),
  ]);

  const funnel: Record<string, number> = {
    [DemoEvents.VIEW_LISTING]: 0,
    [DemoEvents.CONTACT_BROKER]: 0,
    [DemoEvents.CREATE_OFFER]: 0,
  };
  for (const row of funnelRows) {
    funnel[row.event] = Number(row.count);
  }

  const startedUsers = Number(guidedStartedRows[0]?.c ?? 0);
  const completedUsers = Number(guidedCompletedRows[0]?.c ?? 0);
  const completionRatePct =
    startedUsers > 0 ? Math.round((completedUsers / startedUsers) * 1000) / 10 : 0;

  const stepCounts = new Map<string, number>();
  for (const row of demoStepBreakdown) {
    const id = row.stepId?.trim();
    if (id) stepCounts.set(id, Number(row.count));
  }
  const order = demoSteps.map((s) => s.id);
  let dropOffStep: string | null = null;
  let worstRatio = 1;
  for (let i = 0; i < order.length - 1; i++) {
    const a = stepCounts.get(order[i]) ?? 0;
    const b = stepCounts.get(order[i + 1]) ?? 0;
    if (a > 0) {
      const r = b / a;
      if (r < worstRatio) {
        worstRatio = r;
        dropOffStep = order[i];
      }
    }
  }

  const stepCountsList = order.map((stepId) => ({
    stepId,
    count: stepCounts.get(stepId) ?? 0,
  }));

  const dealAvgRow = dealAnalyzerAvgScoreRow?.[0];
  const dealAvgScore =
    dealAvgRow?.avg != null ? Math.round(Number(dealAvgRow.avg) * 10) / 10 : null;

  return NextResponse.json({
    ok: true,
    windowDays: 7,
    totals: {
      users: userCount,
      events: eventCount,
      sessionStarts,
    },
    blockedCount,
    byEvent: byEventRows.map((r) => ({ event: r.event, count: Number(r.count) })),
    last24h: recent,
    topListingViews: topListingViews.map((r) => ({
      listingId: r.listingId,
      count: Number(r.count),
    })),
    topSearchQueries: topSearchQueries.map((r) => ({
      query: r.q,
      count: Number(r.count),
    })),
    topBlockedRoutes: topBlockedRoutes.map((r) => ({
      route: r.route.length > 120 ? `${r.route.slice(0, 117)}…` : r.route,
      count: Number(r.count),
    })),
    funnel: {
      view_listing: funnel[DemoEvents.VIEW_LISTING] ?? 0,
      contact_broker: funnel[DemoEvents.CONTACT_BROKER] ?? 0,
      create_offer: funnel[DemoEvents.CREATE_OFFER] ?? 0,
    },
    guidedDemo: {
      startedUsers,
      completedUsers,
      completionRatePct,
      dropOffStep,
      stepCounts: stepCountsList,
    },
    dealAnalyzer: {
      runs: dealAnalyzerUsedCount,
      completions: dealAnalyzerCompletedCount,
      avgScore: dealAvgScore,
      topListings: (topDealAnalyzerListings ?? []).map((r) => ({
        listingId: r.listingId,
        count: Number(r.count),
      })),
    },
    mortgageSimulator: {
      used: mortgageSimulatorUsedCount,
      scenarioAdded: scenarioAddedCount,
      scenarioCompared: scenarioComparedCount,
    },
  });
}
