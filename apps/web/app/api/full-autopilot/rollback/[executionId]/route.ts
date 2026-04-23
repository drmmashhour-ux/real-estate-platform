import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { rollbackAutopilotExecution } from "@/modules/autopilot-execution/autopilot-execution-rollback.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, ctx: { params: Promise<{ executionId: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { executionId } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason : "rollback_requested";

  const res = await rollbackAutopilotExecution({
    executionId,
    actorUserId: auth.userId,
    reason,
  });

  if (!res.ok) {
    return NextResponse.json({ error: res.reason }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
