/**
 * Unified LECIPM analytics — deterministic aggregates from Prisma (no ML).
 */

import { AccountStatus, Prisma, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  FunnelStep,
  TimeSeriesPoint,
  UnifiedAnalyticsKpis,
  UnifiedAnalyticsPayload,
  UnifiedAnalyticsRangePreset,
  UnifiedAnalyticsView,
} from "./unified-analytics.types";
import { buildForecastFromSeries } from "./forecast.service";
import { buildDeterministicInsights } from "./analytics-insights.service";
import { buildAnalyticsAlerts } from "./analytics-alerts.service";

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addUtcDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export function parseUnifiedRange(preset: UnifiedAnalyticsRangePreset): {
  preset: UnifiedAnalyticsRangePreset;
  from: Date;
  toExclusive: Date;
  fromIso: string;
  toExclusiveIso: string;
} {
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const days =
    preset === "7d" ? 7
    : preset === "90d" ? 90
    : 30;
  const from = addUtcDays(todayStart, -(days - 1));
  const toExclusive = addUtcDays(todayStart, 1);
  return {
    preset,
    from,
    toExclusive,
    fromIso: from.toISOString(),
    toExclusiveIso: toExclusive.toISOString(),
  };
}

function dateWhere(from: Date, toExclusive: Date): Prisma.DateTimeFilter {
  return { gte: from, lt: toExclusive };
}

function prevWindow(from: Date, toExclusive: Date): { prevFrom: Date; prevToExclusive: Date } {
  const lenMs = toExclusive.getTime() - from.getTime();
  const prevToExclusive = new Date(from.getTime());
  const prevFrom = new Date(from.getTime() - lenMs);
  return { prevFrom, prevToExclusive };
}

function operatorLeadWhere(
  viewerId: string,
  role: PlatformRole,
): Prisma.LeadWhereInput | undefined {
  if (role === "BROKER") {
    return {
      OR: [{ introducedByBrokerId: viewerId }, { lastFollowUpByBrokerId: viewerId }],
    };
  }
  if (role === "HOST") {
    return { shortTermListing: { ownerId: viewerId } };
  }
  if (role === "LISTING_OPERATOR" || role === "OUTREACH_OPERATOR") {
    /** Workspace operators see platform-wide funnel without lead PII slicing. */
    return undefined;
  }
  return undefined;
}

async function revenueForView(params: {
  viewerId: string;
  role: PlatformRole;
  view: UnifiedAnalyticsView;
  dateFilter: Prisma.DateTimeFilter;
}): Promise<number> {
  const { viewerId, role, view, dateFilter } = params;

  if (view === "full" || view === "investor") {
    const agg = await prisma.platformPayment.aggregate({
      where: { status: "paid", createdAt: dateFilter },
      _sum: { amountCents: true },
    });
    return agg._sum.amountCents ?? 0;
  }

  /** operator */
  if (role === "BROKER") {
    const rows = await prisma.brokerCommission.findMany({
      where: {
        brokerId: viewerId,
        payment: {
          status: "paid",
          createdAt: dateFilter,
        },
      },
      select: { brokerAmountCents: true },
    });
    return rows.reduce((s, r) => s + (r.brokerAmountCents ?? 0), 0);
  }

  if (role === "HOST") {
    const agg = await prisma.platformPayment.aggregate({
      where: {
        status: "paid",
        createdAt: dateFilter,
        booking: { listing: { ownerId: viewerId } },
      },
      _sum: { platformFeeCents: true, hostPayoutCents: true },
    });
    return (agg._sum.platformFeeCents ?? 0) + (agg._sum.hostPayoutCents ?? 0);
  }

  /** LISTING_OPERATOR / OUTREACH_OPERATOR — platform fee rollup (performance proxy) */
  const agg = await prisma.platformPayment.aggregate({
    where: { status: "paid", createdAt: dateFilter },
    _sum: { platformFeeCents: true },
  });
  return agg._sum.platformFeeCents ?? 0;
}

async function dailySeries(
  from: Date,
  toExclusive: Date,
  kind: "revenue" | "leads",
  leadExtra: Prisma.LeadWhereInput | undefined,
): Promise<TimeSeriesPoint[]> {
  const points: TimeSeriesPoint[] = [];
  for (let d = new Date(from); d < toExclusive; d = addUtcDays(d, 1)) {
    const dayStart = startOfUtcDay(d);
    const dayEnd = addUtcDays(dayStart, 1);
    const dw = dateWhere(dayStart, dayEnd);
    let value = 0;
    if (kind === "revenue") {
      const agg = await prisma.platformPayment.aggregate({
        where: { status: "paid", createdAt: dw },
        _sum: { amountCents: true },
      });
      value = agg._sum.amountCents ?? 0;
    } else {
      value = await prisma.lead.count({
        where: {
          createdAt: dw,
          ...(leadExtra ?? {}),
        },
      });
    }
    points.push({ date: dayStart.toISOString().slice(0, 10), value });
  }
  return points;
}

async function dailySeriesOperator(
  from: Date,
  toExclusive: Date,
  viewerId: string,
  role: PlatformRole,
  kind: "revenue" | "leads",
  leadExtra: Prisma.LeadWhereInput | undefined,
): Promise<TimeSeriesPoint[]> {
  const points: TimeSeriesPoint[] = [];
  for (let d = new Date(from); d < toExclusive; d = addUtcDays(d, 1)) {
    const dayStart = startOfUtcDay(d);
    const dayEnd = addUtcDays(dayStart, 1);
    const dw = dateWhere(dayStart, dayEnd);
    let value = 0;
    if (kind === "leads") {
      value = await prisma.lead.count({
        where: {
          createdAt: dw,
          ...(leadExtra ?? {}),
        },
      });
    } else if (role === "BROKER") {
      const rows = await prisma.brokerCommission.findMany({
        where: {
          brokerId: viewerId,
          payment: { status: "paid", createdAt: dw },
        },
        select: { brokerAmountCents: true },
      });
      value = rows.reduce((s, r) => s + (r.brokerAmountCents ?? 0), 0);
    } else if (role === "HOST") {
      const agg = await prisma.platformPayment.aggregate({
        where: {
          status: "paid",
          createdAt: dw,
          booking: { listing: { ownerId: viewerId } },
        },
        _sum: { platformFeeCents: true, hostPayoutCents: true },
      });
      value = (agg._sum.platformFeeCents ?? 0) + (agg._sum.hostPayoutCents ?? 0);
    } else {
      const agg = await prisma.platformPayment.aggregate({
        where: { status: "paid", createdAt: dw },
        _sum: { platformFeeCents: true },
      });
      value = agg._sum.platformFeeCents ?? 0;
    }
    points.push({ date: dayStart.toISOString().slice(0, 10), value });
  }
  return points;
}

export async function computeUnifiedAnalytics(params: {
  viewerId: string;
  role: PlatformRole;
  view: UnifiedAnalyticsView;
  rangePreset: UnifiedAnalyticsRangePreset;
}): Promise<UnifiedAnalyticsPayload> {
  const { viewerId, role, view } = params;
  const range = parseUnifiedRange(params.rangePreset);
  const df = dateWhere(range.from, range.toExclusive);
  const { prevFrom, prevToExclusive } = prevWindow(range.from, range.toExclusive);
  const dfPrev = dateWhere(prevFrom, prevToExclusive);

  const leadExtra = view === "operator" ? operatorLeadWhere(viewerId, role) : undefined;

  const [
    totalUsers,
    activeUsers,
    leadsTotal,
    leadsPrev,
    leadsWon,
    avgLeadScoreRow,
    revenueCents,
    revenuePrev,
    payingUsersDistinct,
    totalPayingLifetime,
    activePrevWindow,
    activeOlderWindow,
    funnelRows,
    cityRows,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { updatedAt: df, accountStatus: AccountStatus.ACTIVE },
    }),
    prisma.lead.count({
      where: { createdAt: df, ...(leadExtra ?? {}) },
    }),
    prisma.lead.count({
      where: { createdAt: dfPrev, ...(leadExtra ?? {}) },
    }),
    prisma.lead.count({
      where: {
        createdAt: df,
        ...(leadExtra ?? {}),
        OR: [
          { pipelineStage: { equals: "won", mode: "insensitive" } },
          { pipelineStatus: { equals: "won", mode: "insensitive" } },
        ],
      },
    }),
    prisma.lead.aggregate({
      where: { createdAt: df, ...(leadExtra ?? {}) },
      _avg: { score: true },
    }),
    revenueForView({ viewerId, role, view, dateFilter: df }),
    revenueForView({ viewerId, role, view, dateFilter: dfPrev }),
    prisma.platformPayment.findMany({
      where: { status: "paid" },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.platformPayment.aggregate({
      where: { status: "paid" },
      _sum: { amountCents: true },
    }),
    prisma.user.count({
      where: { updatedAt: dfPrev, accountStatus: AccountStatus.ACTIVE },
    }),
    prisma.user.count({
      where: {
        updatedAt: dateWhere(prevFrom, range.from),
        accountStatus: AccountStatus.ACTIVE,
      },
    }),
    prisma.analyticsFunnelEvent.groupBy({
      by: ["name"],
      where: { createdAt: df },
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["fsboListingId"],
      where: {
        createdAt: df,
        fsboListingId: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { _all: "desc" } },
      take: 5,
    }),
  ]);

  const conversionRate = leadsTotal > 0 ? leadsWon / leadsTotal : 0;

  const leadsWonPrev = await prisma.lead.count({
    where: {
      createdAt: dfPrev,
      ...(leadExtra ?? {}),
      OR: [
        { pipelineStage: { equals: "won", mode: "insensitive" } },
        { pipelineStatus: { equals: "won", mode: "insensitive" } },
      ],
    },
  });
  const priorConversionRate = leadsPrev > 0 ? leadsWonPrev / leadsPrev : 0;

  const revenuePerLeadCents = leadsTotal > 0 ? Math.round(revenueCents / leadsTotal) : null;

  const newUsersInRange = await prisma.user.count({ where: { createdAt: df } });
  const marketingSpendEnv = Number(process.env.ANALYTICS_MARKETING_SPEND_CENTS ?? "");
  const cacCents =
    newUsersInRange > 0 && Number.isFinite(marketingSpendEnv) && marketingSpendEnv > 0
      ? Math.round(marketingSpendEnv / newUsersInRange)
      : null;

  const payingN = payingUsersDistinct.length;
  const ltvCents =
    payingN > 0 ? Math.round((totalPayingLifetime._sum.amountCents ?? 0) / payingN) : null;

  const churnRate =
    activeOlderWindow > 0 ? Math.min(1, Math.max(0, 1 - activePrevWindow / activeOlderWindow)) : null;

  const leadQualityScore =
    avgLeadScoreRow._avg.score != null ? Math.round(Math.min(100, Math.max(0, avgLeadScoreRow._avg.score))) : null;

  const kpis: UnifiedAnalyticsKpis = {
    totalUsers,
    activeUsers,
    leadsGenerated: leadsTotal,
    conversionRate,
    revenueCents,
    revenuePerLeadCents,
    cacCents,
    ltvCents,
    churnRate,
    leadQualityScore,
  };

  let revenueSeries: TimeSeriesPoint[];
  let leadSeries: TimeSeriesPoint[];
  if (view === "operator") {
    revenueSeries = await dailySeriesOperator(range.from, range.toExclusive, viewerId, role, "revenue", leadExtra);
    leadSeries = await dailySeriesOperator(range.from, range.toExclusive, viewerId, role, "leads", leadExtra);
  } else {
    revenueSeries = await dailySeries(range.from, range.toExclusive, "revenue", undefined);
    leadSeries = await dailySeries(range.from, range.toExclusive, "leads", leadExtra);
  }

  const growthSeries = revenueSeries.map((p, i) => ({
    date: p.date,
    value:
      i === 0 ? 0
      : p.value > 0 && revenueSeries[i - 1]!.value > 0 ?
        Math.round(((p.value - revenueSeries[i - 1]!.value) / revenueSeries[i - 1]!.value) * 1000) / 10
      : 0,
  }));

  const funnel: FunnelStep[] = funnelRows
    .map((r) => ({
      id: r.name,
      label: String(r.name).replace(/_/g, " "),
      count: r._count._all,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const forecast = buildForecastFromSeries({
    revenueDaily: revenueSeries,
    leadDaily: leadSeries,
  });

  let topCityLabel: string | null = null;
  if (cityRows.length > 0 && cityRows[0]?.fsboListingId) {
    const fsbo = await prisma.fsboListing.findUnique({
      where: { id: cityRows[0].fsboListingId! },
      select: { city: true },
    });
    topCityLabel = fsbo?.city?.trim() || null;
  }

  const insights = buildDeterministicInsights({
    conversionRate,
    conversionPrev,
    leadsTotal,
    leadsPrev,
    revenueCents,
    revenuePrevCents: revenuePrev,
    topCityLabel,
    demandSpikeRisk: forecast.demandSpikeRisk,
    growthTrendPct: forecast.growthTrendPct,
  });

  const leadVals = leadSeries.map((p) => p.value);
  const lm = leadVals.reduce((a, b) => a + b, 0) / Math.max(1, leadVals.length);
  const lv = leadVals.reduce((s, x) => s + (x - lm) ** 2, 0) / Math.max(1, leadVals.length);
  const ls = Math.sqrt(lv);
  const last = leadVals[leadVals.length - 1] ?? 0;
  const anomalyZ = ls > 0 ? (last - lm) / ls : 0;

  const alerts = buildAnalyticsAlerts({
    conversionRate,
    revenueCents,
    revenuePrevCents: revenuePrev,
    anomalyZ,
  });

  const notes: string[] = [];
  if (cacCents == null) {
    notes.push("Set ANALYTICS_MARKETING_SPEND_CENTS for a CAC estimate from marketing spend.");
  }
  if (view === "investor") {
    notes.push("Investor view shows rolled-up KPIs — detailed row-level cuts are admin-only.");
  }

  return {
    generatedAt: new Date().toISOString(),
    range: {
      preset: params.rangePreset,
      from: range.fromIso,
      toExclusive: range.toExclusiveIso,
    },
    view,
    role,
    kpis,
    revenueSeries,
    growthSeries,
    leadSeries,
    funnel,
    forecast,
    insights,
    alerts,
    notes,
  };
}
