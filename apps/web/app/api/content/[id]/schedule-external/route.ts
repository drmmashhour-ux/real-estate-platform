import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { scheduleContentJob } from "@/lib/content-automation/schedule-content-job";

export const dynamic = "force-dynamic";

/**
 * Schedule a content job via Metricool or Buffer. `id` is `ContentJob.id`.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: jobId } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as {
    scheduledAt?: string;
    platforms?: ("tiktok" | "instagram" | "facebook")[];
    captionAssetId?: string;
  };

  const res = await scheduleContentJob({
    jobId,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    platforms: body.platforms,
    captionAssetId: body.captionAssetId,
    actorUserId: userId,
  });

  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 400 });
  }
  if (res.provider === "draft_only") {
    return NextResponse.json({ ok: true, provider: res.provider, warning: res.warning });
  }
  return NextResponse.json({ ok: true, provider: res.provider, externalId: res.externalId });
}
