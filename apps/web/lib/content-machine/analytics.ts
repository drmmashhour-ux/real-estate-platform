import type { ContentMachineStyle } from "@prisma/client";
import { prisma } from "@/lib/db";
import { legacyScoreFromRow } from "@/lib/content-intelligence/scoring";

export type StylePerformanceRow = {
  style: ContentMachineStyle;
  pieces: number;
  views: number;
  clicks: number;
  conversions: number;
  /** Sum of per-piece weighted scores (same formula as leaderboard) */
  scoreSum: number;
};

/**
 * Aggregate views / clicks / conversions by **style** to spot winning patterns (e.g. price_shock vs lifestyle).
 */
export async function getStylePerformanceRollup(): Promise<StylePerformanceRow[]> {
  const rows = await prisma.machineGeneratedContent.findMany({
    select: {
      style: true,
      views: true,
      clicks: true,
      conversions: true,
      saves: true,
      shares: true,
      bookings: true,
      revenueCents: true,
    },
  });

  const map = new Map<
    ContentMachineStyle,
    { pieces: number; views: number; clicks: number; conversions: number; scoreSum: number }
  >();

  for (const r of rows) {
    const score = legacyScoreFromRow(r);
    const cur = map.get(r.style) ?? { pieces: 0, views: 0, clicks: 0, conversions: 0, scoreSum: 0 };
    cur.pieces += 1;
    cur.views += r.views;
    cur.clicks += r.clicks;
    cur.conversions += r.conversions;
    cur.scoreSum += score;
    map.set(r.style, cur);
  }

  return [...map.entries()]
    .map(([style, v]) => ({ style, ...v }))
    .sort((a, b) => b.scoreSum - a.scoreSum);
}
