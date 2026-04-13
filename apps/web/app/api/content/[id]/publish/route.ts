import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { publishContentJobDirect } from "@/lib/content-automation/publish-direct-job";

export const dynamic = "force-dynamic";

/**
 * Publish a content automation job to TikTok (scheduler), Instagram (Meta), or Facebook (Meta Page).
 * `id` is `ContentJob.id`.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: jobId } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as {
    platform?: "tiktok" | "instagram" | "facebook";
    mode?: "draft" | "direct";
  };

  if (!body.platform) {
    return NextResponse.json({ error: "platform required (tiktok | instagram | facebook)" }, { status: 400 });
  }

  const res = await publishContentJobDirect({
    jobId,
    platform: body.platform,
    mode: body.mode,
    actorUserId: userId,
  });

  if (!res.ok) {
    return NextResponse.json({ error: res.error, detail: res.detail }, { status: 422 });
  }
  return NextResponse.json({ ok: true, detail: res.detail });
}
