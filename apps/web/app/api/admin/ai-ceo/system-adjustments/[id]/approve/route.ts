import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { approveSystemAdjustment } from "@/modules/ai-ceo/ai-ceo-system-adjustment-policy.service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  let body: { approvalReason?: string; expectedEffect?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const approvalReason =
    typeof body.approvalReason === "string" ? body.approvalReason.trim() : "";
  if (!approvalReason) {
    return NextResponse.json({ error: "approval_reason_required" }, { status: 400 });
  }

  try {
    const row = await approveSystemAdjustment({
      id,
      approvedByUserId: auth.userId,
      approvalReason,
      expectedEffect: typeof body.expectedEffect === "string" ? body.expectedEffect : null,
    });
    return NextResponse.json({ ok: true, adjustment: row });
  } catch (e) {
    console.error("[admin/ai-ceo/system-adjustments/approve]", e);
    return NextResponse.json({ error: "approve_failed" }, { status: 500 });
  }
}
