import { NextResponse } from "next/server";
import { ingestPerformanceMetrics } from "@/src/modules/growth-automation/analytics/ingestPerformanceMetrics";
import { listPerformanceMetrics } from "@/src/modules/growth-automation/infrastructure/growthAutomationRepository";
import { requireGrowthAutomationAdmin } from "@/src/modules/growth-automation/infrastructure/growthApiAuth";
import type { GrowthMarketingPlatform } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireGrowthAutomationAdmin();
  if (!auth.ok) return auth.response;
  const metrics = await listPerformanceMetrics(200);
  return NextResponse.json({ metrics });
}

export async function POST(req: Request) {
  const auth = await requireGrowthAutomationAdmin();
  if (!auth.ok) return auth.response;
  const body = await req.json().catch(() => ({}));
  const contentItemId = typeof body.contentItemId === "string" ? body.contentItemId : "";
  const platform = body.platform as GrowthMarketingPlatform;
  const metricDate = typeof body.metricDate === "string" ? body.metricDate : "";
  if (!contentItemId || !platform || !metricDate) {
    return NextResponse.json({ error: "contentItemId, platform, metricDate (ISO date) required" }, { status: 400 });
  }
  await ingestPerformanceMetrics({
    contentItemId,
    platform,
    metricDate,
    views: Number(body.views) || 0,
    impressions: body.impressions != null ? Number(body.impressions) : null,
    likes: body.likes != null ? Number(body.likes) : null,
    comments: body.comments != null ? Number(body.comments) : null,
    shares: body.shares != null ? Number(body.shares) : null,
    clicks: body.clicks != null ? Number(body.clicks) : null,
    conversions: body.conversions != null ? Number(body.conversions) : null,
  });
  return NextResponse.json({ ok: true });
}
