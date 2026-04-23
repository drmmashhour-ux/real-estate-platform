import { NextResponse } from "next/server";

import { requireMobileAdmin } from "@/modules/auth/mobile-auth";
import { buildMobileFullAutopilotSummary } from "@/modules/autopilot-governance/full-autopilot-mobile.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireMobileAdmin(request);
  } catch (e) {
    const status = (e as Error & { status?: number })?.status ?? 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  try {
    const payload = await buildMobileFullAutopilotSummary();
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[mobile full-autopilot summary]", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
