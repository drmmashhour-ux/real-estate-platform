import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { recordVideoPerformanceEvent } from "@/modules/video-engine/video-performance.service";
import { transitionVideoProjectStatus } from "@/modules/video-engine/video-export.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  const body = (await req.json()) as { scheduledAt?: string };
  if (!body.scheduledAt) return NextResponse.json({ error: "scheduledAt_required" }, { status: 400 });

  const when = new Date(body.scheduledAt);
  if (Number.isNaN(when.getTime())) return NextResponse.json({ error: "invalid_date" }, { status: 400 });

  await transitionVideoProjectStatus(id, "scheduled", { scheduledAt: when });
  await recordVideoPerformanceEvent(id, "video_scheduled", { scheduledAt: when.toISOString() });
  return NextResponse.json({ ok: true });
}
