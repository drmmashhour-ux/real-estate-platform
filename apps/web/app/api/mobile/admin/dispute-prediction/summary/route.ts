import { NextResponse } from "next/server";

import { requireMobileAdmin } from "@/modules/auth/mobile-auth";
import { loadDisputePredictionDashboardPayload } from "@/modules/dispute-prediction/dispute-prediction-dashboard.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireMobileAdmin(request);
  } catch (e) {
    const status = (e as Error & { status?: number })?.status ?? 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  try {
    const summary = await loadDisputePredictionDashboardPayload();
    return NextResponse.json({ summary, generatedAt: new Date().toISOString() });
  } catch (e) {
    console.error("[mobile/admin/dispute-prediction/summary]", e);
    return NextResponse.json({ error: "summary_failed" }, { status: 500 });
  }
}
