import { NextRequest } from "next/server";
import { requireAdminSurfaceApi } from "@/app/api/ai/admin-guard";
import { compareVariants } from "@/lib/marketing-analytics/compare-variants";
import { marketingJsonError, marketingJsonOk } from "@/lib/marketing/http-response";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ parentId: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const denied = await requireAdminSurfaceApi();
  if (denied) return denied;

  try {
    const { parentId } = await ctx.params;
    const cmp = await compareVariants(parentId);
    if (!cmp) {
      return marketingJsonError(404, "Parent not found", "NOT_FOUND");
    }

    return marketingJsonOk({
      parentContentId: cmp.parentContentId,
      bestVariantId: cmp.best.contentId,
      worstVariantId: cmp.worst.contentId,
      ranking: cmp.ranking.map((r) => ({
        contentId: r.contentId,
        label: r.variantLabel,
        isWinnerVariant: r.isWinnerVariant,
        score: r.score,
        summary: {
          totalViews: r.summary.totalViews,
          totalClicks: r.summary.totalClicks,
          totalConversions: r.summary.totalConversions,
          totalOpens: r.summary.totalOpens,
          ctrPercent: r.summary.ctrPercent,
          conversionPercent: r.summary.conversionPercent,
          openRatePercent: r.summary.openRatePercent,
        },
      })),
      summaryLines: cmp.summaryLines,
    });
  } catch (e) {
    console.error("[api/marketing/analytics/variants/[parentId]]", e);
    return marketingJsonError(500, "Internal error", "INTERNAL");
  }
}
