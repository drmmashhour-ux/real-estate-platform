import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { publishContentJobDirect } from "@/lib/content-automation/publish-direct-job";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    jobId?: string;
    platform?: "tiktok" | "instagram" | "facebook";
    mode?: "draft" | "direct";
  };

  if (!body.jobId || !body.platform) {
    return NextResponse.json({ error: "jobId and platform required" }, { status: 400 });
  }

  const res = await publishContentJobDirect({
    jobId: body.jobId,
    platform: body.platform,
    mode: body.mode,
    actorUserId: userId,
  });

  if (!res.ok) {
    return NextResponse.json({ error: res.error, detail: res.detail }, { status: 422 });
  }
  return NextResponse.json({ ok: true, detail: res.detail });
}
