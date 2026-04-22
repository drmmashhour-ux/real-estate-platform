import { prisma } from "@/lib/db";

import { listTopPerformingVideos, listVideoProjectsByStatus } from "@/modules/video-engine/video-project.service";

import { buildStrategyInsights } from "./marketing-strategy.service";
import { getMarketingPerformanceSummary } from "./marketing-performance.service";
import type { MarketingHubDashboardVm, MarketingMobileSummaryVm, MarketingPostRowVm } from "./marketing.types";

function rowVm(r: {
  id: string;
  contentType: string;
  title: string;
  caption: string;
  hashtagsJson: unknown;
  status: string;
  suggestedPlatform: string;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  manualExport: boolean;
  growthSignalRef: string | null;
  performanceJson: unknown;
  captionEdited: string | null;
}): MarketingPostRowVm {
  const hashtags = Array.isArray(r.hashtagsJson) ? (r.hashtagsJson as string[]) : [];
  const perf = r.performanceJson && typeof r.performanceJson === "object" ? (r.performanceJson as Record<string, unknown>) : null;
  return {
    id: r.id,
    contentType: r.contentType,
    title: r.title,
    caption: r.captionEdited ?? r.caption,
    hashtags,
    status: r.status,
    suggestedPlatform: r.suggestedPlatform,
    scheduledAt: r.scheduledAt?.toISOString() ?? null,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    manualExport: r.manualExport,
    growthSignalRef: r.growthSignalRef,
    performance: perf,
  };
}

function utcDayBounds(d: Date): { start: Date; next: Date } {
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const next = new Date(start.getTime() + 86400000);
  return { start, next };
}

export async function getMarketingMobileSummary(): Promise<MarketingMobileSummaryVm> {
  const { start, next } = utcDayBounds(new Date());
  const [todayPosts, perf, pending, exports] = await Promise.all([
    prisma.lecipmMarketingHubPost.findMany({
      where: {
        OR: [
          { scheduledAt: { gte: start, lt: next } },
          { publishedAt: { gte: start, lt: next } },
        ],
      },
      orderBy: { scheduledAt: "asc" },
      take: 12,
    }),
    getMarketingPerformanceSummary(),
    prisma.lecipmMarketingHubPost.count({ where: { status: "pending_approval" } }),
    prisma.lecipmMarketingHubPost.count({ where: { status: "export_queue", manualExport: true } }),
  ]);

  const alerts: string[] = [];
  if (exports > 0) alerts.push(`${exports} post(s) need manual export (API keys not configured).`);
  if (pending > 8) alerts.push(`${pending} posts awaiting approval — review the Marketing Hub.`);

  return {
    todayPosts: todayPosts.map(rowVm),
    performance: perf,
    alerts,
  };
}

export async function getMarketingHubDashboardPayload(): Promise<MarketingHubDashboardVm> {
  const [queue, ready, perf, insights, videoReviewQueue, videoScheduled, videoTopPerforming] = await Promise.all([
    prisma.lecipmMarketingHubPost.findMany({
      where: {
        status: "scheduled",
        scheduledAt: { not: null },
      },
      orderBy: { scheduledAt: "asc" },
      take: 40,
    }),
    prisma.lecipmMarketingHubPost.findMany({
      where: {
        status: { in: ["draft", "pending_approval"] },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    getMarketingPerformanceSummary(),
    buildStrategyInsights(),
    listVideoProjectsByStatus(["preview", "draft"], 40),
    listVideoProjectsByStatus(["scheduled"], 40),
    listTopPerformingVideos(10),
  ]);

  const growthLinkedDrafts = await prisma.lecipmMarketingHubPost.count({
    where: { growthSignalRef: { not: null }, status: { not: "published" } },
  });

  return {
    queue: queue.map(rowVm),
    generatedReady: ready.map(rowVm),
    performance: perf,
    strategyInsights: insights,
    growthLinkedDrafts,
    videoReviewQueue,
    videoScheduled,
    videoTopPerforming,
  };
}
