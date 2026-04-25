import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { getAutopilotSummary } from "@/modules/scenario-autopilot/scenario-autopilot-run.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const s = await getAutopilotSummary(auth.userId);
  return NextResponse.json(s);
}
