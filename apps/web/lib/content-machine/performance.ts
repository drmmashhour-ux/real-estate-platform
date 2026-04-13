import type { ContentMachineStyle } from "@prisma/client";
import { prisma } from "@/lib/db";
import { legacyScoreFromRow } from "@/lib/content-intelligence/scoring";

/**
 * Weighted score for ranking pieces (views, engagement, conversions, revenue when present).
 */
export function contentMachinePerformanceScore(views: number, clicks: number, conversions: number): number {
  return legacyScoreFromRow({
    views,
    clicks,
    conversions,
    saves: 0,
    shares: 0,
    bookings: 0,
    revenueCents: 0,
  });
}

export type TopMachineContentOrderBy = "score" | "conversions" | "views" | "clicks";

export async function getTopPerformingMachineContent(opts: {
  limit?: number;
  orderBy: TopMachineContentOrderBy;
  style?: ContentMachineStyle;
}) {
  const limit = Math.min(Math.max(opts.limit ?? 30, 1), 200);
  const prefetch = opts.orderBy === "score" ? Math.min(limit * 5, 600) : limit;
  const where = opts.style ? { style: opts.style } : {};

  const rows = await prisma.machineGeneratedContent.findMany({
    where,
    take: prefetch,
    include: {
      listing: { select: { id: true, title: true, listingCode: true } },
    },
    orderBy:
      opts.orderBy === "score"
        ? { updatedAt: "desc" }
        : opts.orderBy === "conversions"
          ? { conversions: "desc" }
          : opts.orderBy === "clicks"
            ? { clicks: "desc" }
            : { views: "desc" },
  });

  if (opts.orderBy !== "score") {
    return rows.slice(0, limit);
  }

  const sorted = [...rows].sort(
    (a, b) =>
      (b.performanceScore ?? legacyScoreFromRow(b)) - (a.performanceScore ?? legacyScoreFromRow(a)),
  );
  return sorted.slice(0, limit);
}
