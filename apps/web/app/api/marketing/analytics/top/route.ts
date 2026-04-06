import { NextRequest } from "next/server";
import type { MarketingContentType, MarketingPublishChannel } from "@prisma/client";
import { requireAdminSurfaceApi } from "@/app/api/ai/admin-guard";
import { getTopPerformingContent } from "@/lib/marketing-analytics/aggregate-metrics";
import { marketingJsonError, marketingJsonOk } from "@/lib/marketing/http-response";

export const dynamic = "force-dynamic";

function parseType(raw: string | null): MarketingContentType | undefined {
  if (!raw) return undefined;
  const u = raw.trim().toUpperCase();
  if (u === "SOCIAL_POST" || u === "SOCIAL POST") return "SOCIAL_POST";
  if (u === "CAPTION") return "CAPTION";
  if (u === "EMAIL") return "EMAIL";
  if (u === "GROWTH_IDEA" || u === "GROWTH") return "GROWTH_IDEA";
  return undefined;
}

function parseChannel(raw: string | null): MarketingPublishChannel | undefined {
  if (!raw) return undefined;
  const u = raw.trim().toUpperCase();
  const ok = ["EMAIL", "X", "LINKEDIN", "INSTAGRAM", "TIKTOK"] as const;
  return ok.includes(u as (typeof ok)[number]) ? (u as MarketingPublishChannel) : undefined;
}

export async function GET(request: NextRequest) {
  const denied = await requireAdminSurfaceApi();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const type = parseType(searchParams.get("type"));
    const channel = parseChannel(searchParams.get("channel"));
    const limit = Math.min(Number(searchParams.get("limit")) || 15, 50);
    const includeVariants = searchParams.get("includeVariants") === "1";

    const rows = await getTopPerformingContent({
      type,
      channel,
      take: limit,
      includeVariants,
    });

    return marketingJsonOk({
      items: rows.map((r) => ({
        contentId: r.contentId,
        type: r.type,
        theme: r.theme,
        publishChannel: r.publishChannel,
        totalViews: r.totalViews,
        totalClicks: r.totalClicks,
        totalConversions: r.totalConversions,
        totalOpens: r.totalOpens,
        ctrPercent: r.ctrPercent,
        conversionPercent: r.conversionPercent,
        openRatePercent: r.openRatePercent,
        snapshotCount: r.snapshotCount,
      })),
    });
  } catch (e) {
    console.error("[api/marketing/analytics/top]", e);
    return marketingJsonError(500, "Internal error", "INTERNAL");
  }
}
