import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { listApprovalQueue } from "@/modules/autopilot-governance/autopilot-approval-queue.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const items = await listApprovalQueue({ take: 120 });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("[full-autopilot/approvals]", e);
    return NextResponse.json({ error: "approvals_failed" }, { status: 500 });
  }
}
