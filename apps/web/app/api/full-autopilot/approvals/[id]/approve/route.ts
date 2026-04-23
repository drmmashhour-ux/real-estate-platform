import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { approveQueuedPlatformAction } from "@/modules/autopilot-governance/autopilot-approval-queue.service";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;

  try {
    await approveQueuedPlatformAction(id, auth.userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "approve_failed";
    return NextResponse.json({ error: msg }, { status: msg === "invalid_state" ? 409 : 400 });
  }
}
