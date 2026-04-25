import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { executeApprovedRun } from "@/modules/scenario-autopilot/scenario-execution.service";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const r = await executeApprovedRun(id, auth.userId);
  if (!r.ok) {
    return NextResponse.json({ error: r.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, steps: r.steps });
}
