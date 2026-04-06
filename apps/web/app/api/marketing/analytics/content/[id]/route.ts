import { NextRequest } from "next/server";
import { requireAdminSurfaceApi } from "@/app/api/ai/admin-guard";
import {
  getContentPerformanceSummary,
  getPerformanceBand,
} from "@/lib/marketing-analytics/aggregate-metrics";
import { compareVariants } from "@/lib/marketing-analytics/compare-variants";
import { suggestImprovements } from "@/lib/marketing-analytics/suggest-improvements";
import { marketingJsonError, marketingJsonOk } from "@/lib/marketing/http-response";
import { getContent } from "@/lib/marketing/marketing-content-service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const denied = await requireAdminSurfaceApi();
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    const row = await getContent(id);
    if (!row) {
      return marketingJsonError(404, "Not found", "NOT_FOUND");
    }

    const summary = await getContentPerformanceSummary(id);
    const band = await getPerformanceBand(id, row.type);
    const preview =
      row.type === "EMAIL" && row.emailBody
        ? row.emailBody
        : row.content.slice(0, 800);
    const suggestions = suggestImprovements(summary, preview);

    const variantCompare =
      !row.isVariant && row.childVariants.length > 0
        ? await compareVariants(id)
        : row.isVariant && row.parentContentId
          ? await compareVariants(row.parentContentId)
          : null;

    return marketingJsonOk({
      contentId: id,
      type: row.type,
      summary: {
        totalViews: summary.totalViews,
        totalClicks: summary.totalClicks,
        totalConversions: summary.totalConversions,
        totalOpens: summary.totalOpens,
        snapshotCount: summary.snapshotCount,
        ctrPercent: summary.ctrPercent,
        conversionPercent: summary.conversionPercent,
        openRatePercent: summary.openRatePercent,
      },
      performanceBand: band,
      suggestions,
      variantCompare: variantCompare
        ? {
            bestVariantId: variantCompare.best.contentId,
            worstVariantId: variantCompare.worst.contentId,
            ranking: variantCompare.ranking.map((r) => ({
              contentId: r.contentId,
              label: r.variantLabel,
              score: r.score,
              isWinnerVariant: r.isWinnerVariant,
              ctrPercent: r.summary.ctrPercent,
              conversionPercent: r.summary.conversionPercent,
              totalViews: r.summary.totalViews,
              totalClicks: r.summary.totalClicks,
              totalConversions: r.summary.totalConversions,
            })),
            summaryLines: variantCompare.summaryLines,
          }
        : null,
    });
  } catch (e) {
    console.error("[api/marketing/analytics/content/[id]]", e);
    return marketingJsonError(500, "Internal error", "INTERNAL");
  }
}
