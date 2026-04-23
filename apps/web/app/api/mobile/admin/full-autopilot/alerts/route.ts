import { NextResponse } from "next/server";

import { requireMobileAdmin } from "@/modules/auth/mobile-auth";
import { evaluateAutopilotAlerts } from "@/modules/autopilot-alerts/autopilot-alerts.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireMobileAdmin(request);
  } catch (e) {
    const status = (e as Error & { status?: number })?.status ?? 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  try {
    const payload = await evaluateAutopilotAlerts();
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[mobile full-autopilot alerts]", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
