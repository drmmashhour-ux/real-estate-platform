import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { expireOptimizationProposal } from "@/modules/marketplace/marketplace-optimization-approval.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  let note: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    note = typeof body?.note === "string" ? body.note : undefined;
  } catch {
    note = undefined;
  }

  try {
    await expireOptimizationProposal({ decisionId: id, actorUserId: auth.userId, note });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "expire_failed";
    const status = msg === "invalid_state" ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
