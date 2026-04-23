import { NextResponse } from "next/server";

import { requireMobileAdmin } from "@/modules/auth/mobile-auth";
import { listApprovalQueue } from "@/modules/autopilot-governance/autopilot-approval-queue.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireMobileAdmin(request);
  } catch (e) {
    const status = (e as Error & { status?: number })?.status ?? 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  try {
    const items = await listApprovalQueue({ take: 60 });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("[mobile full-autopilot approvals]", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
