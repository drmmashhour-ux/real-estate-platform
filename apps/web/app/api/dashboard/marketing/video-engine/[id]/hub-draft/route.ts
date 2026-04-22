import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { createMarketingDraftFromStoredVideoProject } from "@/modules/video-engine/video-marketing-bridge.service";

export const dynamic = "force-dynamic";

/** Push caption + hashtags into Marketing Hub as a pending post (no network publish). */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  try {
    const postId = await createMarketingDraftFromStoredVideoProject(id);
    return NextResponse.json({ ok: true, marketingHubPostId: postId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "hub_draft_failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
