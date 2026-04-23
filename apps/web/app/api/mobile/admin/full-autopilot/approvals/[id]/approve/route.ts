import { NextResponse } from "next/server";

import { requireMobileAdmin } from "@/modules/auth/mobile-auth";
import { approveQueuedPlatformAction } from "@/modules/autopilot-governance/autopilot-approval-queue.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  let userId: string;
  try {
    const u = await requireMobileAdmin(request);
    userId = u.id;
  } catch (e) {
    const status = (e as Error & { status?: number })?.status ?? 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  const { id } = await ctx.params;
  try {
    await approveQueuedPlatformAction(id, userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "approve_failed";
    return NextResponse.json({ error: msg }, { status: 409 });
  }
}
