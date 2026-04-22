import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { transitionVideoProjectStatus } from "@/modules/video-engine/video-export.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  const body = (await req.json()) as { reason?: string };
  await transitionVideoProjectStatus(id, "rejected", { rejectionReason: body.reason ?? "no_reason" });
  return NextResponse.json({ ok: true });
}
