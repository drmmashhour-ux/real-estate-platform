import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { rejectRun } from "@/modules/scenario-autopilot/scenario-approval.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  let body: { reason: string; requestRevision?: boolean };
  try {
    body = (await request.json()) as { reason: string; requestRevision?: boolean };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (typeof body.reason !== "string" || !body.reason.trim()) {
    return NextResponse.json({ error: "reason_required" }, { status: 400 });
  }
  const r = await rejectRun(id, auth.userId, body.reason, { requestRevision: body.requestRevision });
  if (!r.ok) {
    return NextResponse.json({ error: r.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
