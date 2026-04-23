import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { buildFullAutopilotControlCenterPayload } from "@/modules/autopilot-governance/full-autopilot-control-center.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const payload = await buildFullAutopilotControlCenterPayload();
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[full-autopilot/summary]", e);
    return NextResponse.json({ error: "summary_failed" }, { status: 500 });
  }
}
