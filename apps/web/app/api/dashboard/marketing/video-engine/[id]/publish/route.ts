import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { recordVideoPerformanceEvent } from "@/modules/video-engine/video-performance.service";
import { transitionVideoProjectStatus } from "@/modules/video-engine/video-export.service";

export const dynamic = "force-dynamic";

/** Marks the engineered package as published (manual confirmation — not auto-post). */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  await transitionVideoProjectStatus(id, "published");
  await recordVideoPerformanceEvent(id, "video_published", {});
  return NextResponse.json({ ok: true });
}
