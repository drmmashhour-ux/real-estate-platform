import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { scheduleContentJob } from "@/lib/content-automation/schedule-content-job";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    jobId?: string;
    scheduledAt?: string;
    platforms?: ("tiktok" | "instagram")[];
    captionAssetId?: string;
  };

  if (!body.jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }

  const res = await scheduleContentJob({
    jobId: body.jobId,
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
