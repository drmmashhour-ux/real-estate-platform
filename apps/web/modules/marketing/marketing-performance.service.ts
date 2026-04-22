import { prisma } from "@/lib/db";

import type { MarketingPerformanceSummaryVm } from "./marketing.types";

export type MarketingPerformancePatch = {
  impressions?: number;
  clicks?: number;
  leads?: number;
  bookings?: number;
};

export async function recordMarketingPerformance(postId: string, patch: MarketingPerformancePatch): Promise<void> {
  const row = await prisma.lecipmMarketingHubPost.findUnique({
    where: { id: postId },
    select: { performanceJson: true },
  });
  const prev = (row?.performanceJson as Record<string, unknown> | null) ?? {};
  const next = {
    ...prev,
    impressions: Number(patch.impressions ?? prev.impressions ?? 0),
    clicks: Number(patch.clicks ?? prev.clicks ?? 0),
    leadsAttributed: Number(patch.leads ?? prev.leadsAttributed ?? 0),
    bookingsAttributed: Number(patch.bookings ?? prev.bookingsAttributed ?? 0),
    updatedAt: new Date().toISOString(),
  };

  await prisma.lecipmMarketingHubPost.update({
    where: { id: postId },
    data: { performanceJson: next as object },
  });
}

export async function getMarketingPerformanceSummary(): Promise<MarketingPerformanceSummaryVm> {
  const rows = await prisma.lecipmMarketingHubPost.findMany({
    select: { id: true, performanceJson: true },
    take: 200,
    orderBy: { updatedAt: "desc" },
  });

  let totalImpressionsApprox = 0;
  let totalClicksApprox = 0;
  let leadsAttributedApprox = 0;
  let bookingsAttributedApprox = 0;
  let bestId: string | null = null;
  let bestScore = -1;

  for (const r of rows) {
    const p = (r.performanceJson as Record<string, unknown>) ?? {};
    const imp = Number(p.impressions ?? 0);
    const clk = Number(p.clicks ?? 0);
    const ld = Number(p.leadsAttributed ?? 0);
    const bk = Number(p.bookingsAttributed ?? 0);
    totalImpressionsApprox += imp;
    totalClicksApprox += clk;
    leadsAttributedApprox += ld;
    bookingsAttributedApprox += bk;
    const score = clk * 2 + ld * 10 + bk * 25 + imp * 0.01;
    if (score > bestScore) {
      bestScore = score;
      bestId = r.id;
    }
  }

  return {
    postsTracked: rows.length,
    totalImpressionsApprox,
    totalClicksApprox,
    leadsAttributedApprox,
    bookingsAttributedApprox,
    bestPostId: bestId,
  };
}
