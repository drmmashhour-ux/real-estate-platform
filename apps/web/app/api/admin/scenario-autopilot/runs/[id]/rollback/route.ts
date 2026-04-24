import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { rollbackRun } from "@/modules/scenario-autopilot/scenario-rollback.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  let body: { reason: string };
  try {
    body = (await request.json()) as { reason: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (typeof body.reason !== "string" || !body.reason.trim()) {
    return NextResponse.json({ error: "reason_required" }, { status: 400 });
  }
  const r = await rollbackRun(id, auth.userId, body.reason);
  if (!r.ok) {
    return NextResponse.json({ error: r.error, note: r.note }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
