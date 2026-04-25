import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { loadDisputePredictionDashboardPayload } from "@/modules/dispute-prediction/dispute-prediction-dashboard.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const payload = await loadDisputePredictionDashboardPayload();
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[admin/dispute-prediction/dashboard]", e);
    return NextResponse.json({ error: "dashboard_failed" }, { status: 500 });
  }
}
