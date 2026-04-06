import type { MarketingContentType, MarketingPublishChannel } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ratioToPercent, safeRatio } from "./ratios";

export type ContentPerformanceSummary = {
  contentId: string;
  totalViews: number;
  totalClicks: number;
  totalConversions: number;
  totalOpens: number;
  snapshotCount: number;
  ctr: number | null;
  ctrPercent: number | null;
  conversionRate: number | null;
  conversionPercent: number | null;
  openRate: number | null;
  openRatePercent: number | null;
};

type MetricRow = {
  views: number | null;
  clicks: number | null;
  conversions: number | null;
  opens: number | null;
};

function sumMetrics(rows: MetricRow[]) {
  let totalViews = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  let totalOpens = 0;
  for (const r of rows) {
    totalViews += r.views ?? 0;
    totalClicks += r.clicks ?? 0;
    totalConversions += r.conversions ?? 0;
    totalOpens += r.opens ?? 0;
  }
  return { totalViews, totalClicks, totalConversions, totalOpens };
}

function buildSummaryFromRows(contentId: string, rows: MetricRow[]): ContentPerformanceSummary {
  const { totalViews, totalClicks, totalConversions, totalOpens } = sumMetrics(rows);
  const ctr = safeRatio(totalClicks, totalViews);
  const conversionRate = safeRatio(totalConversions, totalClicks);
  const openRate = safeRatio(totalOpens, totalViews);
  return {
    contentId,
    totalViews,
    totalClicks,
    totalConversions,
    totalOpens,
    snapshotCount: rows.length,
    ctr,
    ctrPercent: ratioToPercent(ctr),
    conversionRate,
    conversionPercent: ratioToPercent(conversionRate),
    openRate,
    openRatePercent: ratioToPercent(openRate),
  };
}

export async function getContentPerformanceSummary(contentId: string): Promise<ContentPerformanceSummary> {
  const rows = await prisma.marketingMetric.findMany({
    where: { contentId },
    select: { views: true, clicks: true, conversions: true, opens: true },
    orderBy: { createdAt: "asc" },
  });
  return buildSummaryFromRows(contentId, rows);
}

/** Score for ranking: prioritize conversions, then engagement. */
export function performanceScore(s: Pick<ContentPerformanceSummary, "totalConversions" | "totalClicks" | "totalViews">): number {
  return s.totalConversions * 10_000 + s.totalClicks * 100 + s.totalViews;
}

export type TopContentRow = ContentPerformanceSummary & {
  type: MarketingContentType;
  theme: string | null;
  publishChannel: MarketingPublishChannel | null;
};

/**
 * Ranks content by aggregated metrics (sums snapshots per content).
 * By default excludes variant child rows (`isVariant=true`).
 */
export async function getTopPerformingContent(params: {
  type?: MarketingContentType;
  channel?: MarketingPublishChannel;
  take?: number;
  includeVariants?: boolean;
}): Promise<TopContentRow[]> {
  const take = Math.min(params.take ?? 15, 50);

  const contents = await prisma.marketingContent.findMany({
    where: {
      ...(params.type ? { type: params.type } : {}),
      ...(params.channel ? { publishChannel: params.channel } : {}),
      ...(params.includeVariants ? {} : { isVariant: false }),
    },
    select: { id: true, type: true, theme: true, publishChannel: true },
    take: 400,
    orderBy: { updatedAt: "desc" },
  });

  if (contents.length === 0) return [];

  const ids = contents.map((c) => c.id);
  const grouped = await prisma.marketingMetric.groupBy({
    by: ["contentId"],
    where: { contentId: { in: ids } },
    _sum: { views: true, clicks: true, conversions: true, opens: true },
    _count: { _all: true },
  });

  const byId = new Map(grouped.map((g) => [g.contentId, g]));

  const summaries: TopContentRow[] = [];
  for (const c of contents) {
    const g = byId.get(c.id);
    if (!g) continue;
    const total =
      (g._sum.views ?? 0) +
      (g._sum.clicks ?? 0) +
      (g._sum.conversions ?? 0) +
      (g._sum.opens ?? 0);
    if (total === 0) continue;

    const syntheticRow: MetricRow[] = [
      {
        views: g._sum.views ?? 0,
        clicks: g._sum.clicks ?? 0,
        conversions: g._sum.conversions ?? 0,
        opens: g._sum.opens ?? 0,
      },
    ];
    const summary = buildSummaryFromRows(c.id, syntheticRow);
    summary.snapshotCount = g._count._all;
    summaries.push({
      ...summary,
      type: c.type,
      theme: c.theme,
      publishChannel: c.publishChannel,
    });
  }

  summaries.sort((a, b) => performanceScore(b) - performanceScore(a));
  return summaries.slice(0, take);
}

export type PerformanceBand = "top" | "average" | "low";

export async function getPerformanceBand(contentId: string, type: MarketingContentType): Promise<PerformanceBand> {
  const mine = await getContentPerformanceSummary(contentId);
  const cohort = await getTopPerformingContent({ type, take: 40, includeVariants: false });
  const scores = cohort.map((c) => performanceScore(c));
  if (scores.length < 3) return "average";
  const myScore = performanceScore(mine);
  const sorted = [...scores].sort((a, b) => a - b);
  const p75 = sorted[Math.floor(sorted.length * 0.75)] ?? 0;
  const p25 = sorted[Math.floor(sorted.length * 0.25)] ?? 0;
  if (myScore >= p75) return "top";
  if (myScore <= p25) return "low";
  return "average";
}
