import { NextResponse } from "next/server";

import { requireMobileAdmin } from "@/modules/auth/mobile-auth";
import { buildMobileAutonomousBrainSummary } from "@/modules/autonomous-brain/autonomous-brain-summary.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireMobileAdmin(request);
  } catch (e) {
    const status = (e as Error & { status?: number })?.status ?? 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  try {
    const payload = await buildMobileAutonomousBrainSummary();
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[mobile autonomous-brain summary]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
