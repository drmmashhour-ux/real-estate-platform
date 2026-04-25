import { prisma } from "@repo/db";
import { buildPortfolioContextBucketForDeal } from "./context.service";
import { portfolioIntelLog } from "./brokerage-intelligence-logger";
import type { DealPortfolioSlice, SegmentInsight } from "./brokerage-intelligence.types";

/**
 * Read stored aggregates; optionally backfill from recent deals (bounded).
 */
export async function analyzeSegmentPerformance(): Promise<{
  best: SegmentInsight[];
  weak: SegmentInsight[];
  bySegment: SegmentInsight[];
  rationale: string[];
}> {
  const rationale = [
    "Segment keys are coarse (location/price/ stage). Low counts are not reliable for broker ranking or negative labels.",
  ];
  try {
    const stored = await prisma.segmentPerformanceAggregate.findMany({
      orderBy: { winRate: "desc" },
      take: 100,
    });
    const bySegment: SegmentInsight[] = stored.map((s) => ({
      segmentKey: s.segmentKey,
      totalDeals: s.totalDeals,
      wins: s.wins,
      losses: s.losses,
      winRate: s.winRate,
      avgClosingTime: s.avgClosingTime,
    }));
    const withData = bySegment.filter((b) => b.totalDeals >= 2);
    const best = [...withData].sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0)).slice(0, 12);
    const weak = [...withData]
      .filter((b) => (b.winRate ?? 0) < 0.45 && b.totalDeals >= 3)
      .sort((a, b) => (a.winRate ?? 0) - (b.winRate ?? 0))
      .slice(0, 8);
    portfolioIntelLog.segment({ stored: bySegment.length });
    return { best, weak, bySegment, rationale };
  } catch (e) {
    portfolioIntelLog.warn("analyzeSegmentPerformance", { err: e instanceof Error ? e.message : String(e) });
    return { best: [], weak: [], bySegment: [], rationale: ["Unavailable."] };
  }
}

/**
 * Incremental rollup from a single closed deal into segment aggregate (safe, optional).
 */
export async function recordSegmentFromDeal(
  deal: Pick<DealPortfolioSlice, "id" | "priceCents" | "crmStage" | "status" | "lastUpdatedAt" | "propertyRegion" | "workspaceId">,
  outcome: "win" | "loss",
  closingDays: number | null
): Promise<void> {
  try {
    const key = buildPortfolioContextBucketForDeal({ ...deal, lastUpdatedAt: deal.lastUpdatedAt, priceCents: deal.priceCents } as DealPortfolioSlice);
    const w = outcome === "win" ? 1 : 0;
    const l = outcome === "loss" ? 1 : 0;
    const ex = await prisma.segmentPerformanceAggregate.findUnique({ where: { segmentKey: key } });
    const newTotal = (ex?.totalDeals ?? 0) + 1;
    const newWins = (ex?.wins ?? 0) + w;
    const newLosses = (ex?.losses ?? 0) + l;
    const winRate = newTotal > 0 ? newWins / newTotal : null;
    let avg: number | null = ex?.avgClosingTime ?? null;
    if (typeof closingDays === "number" && closingDays >= 0) {
      const prevN = ex?.totalDeals ?? 0;
      const n = prevN + 1;
      avg = prevN === 0 ? closingDays : ((avg ?? 0) * prevN + closingDays) / n;
    }
    await prisma.segmentPerformanceAggregate.upsert({
      where: { segmentKey: key },
      create: { segmentKey: key, totalDeals: 1, wins: newWins, losses: newLosses, winRate, avgClosingTime: avg },
      update: { totalDeals: newTotal, wins: newWins, losses: newLosses, winRate, avgClosingTime: avg },
    });
  } catch (e) {
    portfolioIntelLog.warn("recordSegmentFromDeal", { err: e instanceof Error ? e.message : String(e) });
  }
}
