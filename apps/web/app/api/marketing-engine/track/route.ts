import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/marketing-engine/track — increment aggregate performance on `MarketingEngineContent`.
 * Authorization: Bearer $MARKETING_ENGINE_TRACK_SECRET (or $CRON_SECRET if track secret unset).
 *
 * Body: { "contentId": string, "metric": "click" | "engagement" | "conversion" }
 */
export async function POST(request: NextRequest) {
  const trackSecret = process.env.MARKETING_ENGINE_TRACK_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!trackSecret || token !== trackSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    contentId?: string;
    metric?: string;
  };
  const contentId = typeof body.contentId === "string" ? body.contentId.trim() : "";
  const metric = typeof body.metric === "string" ? body.metric.trim().toLowerCase() : "";
  if (!contentId || !["click", "engagement", "conversion"].includes(metric)) {
    return NextResponse.json({ error: "contentId and metric required" }, { status: 400 });
  }

  const updated =
    metric === "click"
      ? await prisma.marketingEngineContent.updateMany({
          where: { id: contentId },
          data: { clicks: { increment: 1 } },
        })
      : metric === "engagement"
        ? await prisma.marketingEngineContent.updateMany({
            where: { id: contentId },
            data: { engagements: { increment: 1 } },
          })
        : await prisma.marketingEngineContent.updateMany({
            where: { id: contentId },
            data: { conversions: { increment: 1 } },
          });
  if (updated.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
