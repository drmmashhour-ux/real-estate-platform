import { prisma } from "@/lib/db";
import { getContentPerformanceSummary, performanceScore, type ContentPerformanceSummary } from "./aggregate-metrics";

export type VariantComparisonRow = {
  contentId: string;
  variantLabel: string;
  isWinnerVariant: boolean;
  summary: ContentPerformanceSummary;
  score: number;
};

export type VariantComparisonResult = {
  parentContentId: string;
  best: VariantComparisonRow;
  worst: VariantComparisonRow;
  ranking: VariantComparisonRow[];
  summaryLines: string[];
};

function labelFor(row: { isVariant: boolean; variantLabel: string | null }): string {
  if (!row.isVariant) return row.variantLabel?.trim() || "A";
  return row.variantLabel?.trim() || "?";
}

/**
 * Compare parent + child variant rows for A/B analysis.
 */
export async function compareVariants(parentContentId: string): Promise<VariantComparisonResult | null> {
  const parent = await prisma.marketingContent.findFirst({
    where: { id: parentContentId, parentContentId: null },
    include: {
      childVariants: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!parent) return null;

  const rows = [parent, ...parent.childVariants];
  const withPerf: VariantComparisonRow[] = [];

  for (const r of rows) {
    const summary = await getContentPerformanceSummary(r.id);
    withPerf.push({
      contentId: r.id,
      variantLabel: labelFor(r),
      isWinnerVariant: r.isWinnerVariant,
      summary,
      score: performanceScore(summary),
    });
  }

  const ranking = [...withPerf].sort((a, b) => b.score - a.score);
  const best = ranking[0]!;
  const worst = ranking[ranking.length - 1]!;

  return {
    parentContentId,
    best,
    worst,
    ranking,
    summaryLines: ranking.map(
      (r, i) =>
        `${i + 1}. Variant ${r.variantLabel} (${r.contentId.slice(0, 8)}…) score=${r.score}` +
        (r.isWinnerVariant ? " ★winner" : "")
    ),
  };
}
