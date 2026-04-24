import { NextResponse } from "next/server";

import { requireMobileAdmin } from "@/modules/auth/mobile-auth";
import { getAutopilotSummary } from "@/modules/scenario-autopilot/scenario-autopilot-run.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const u = await requireMobileAdmin(request);
    const s = await getAutopilotSummary(u.id);
    return NextResponse.json({ ...s, userId: u.id });
  } catch (e) {
    const status = (e as Error & { status?: number })?.status ?? 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
