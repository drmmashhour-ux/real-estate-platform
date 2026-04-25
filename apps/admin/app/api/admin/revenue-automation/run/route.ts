import { NextResponse } from "next/server";
import { requireAdminSurfaceSession } from "@/lib/admin/require-admin-surface-session";
import { revenueAutomationFlags } from "@/config/feature-flags";
import { buildMoneyOperatingSystemSnapshot } from "@/modules/revenue/money-os-aggregator.service";

export const dynamic = "force-dynamic";

/**
 * Latest automation cycle snapshot (same pipeline as GET /api/admin/money-os).
 */
export async function POST() {
  const auth = await requireAdminSurfaceSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!revenueAutomationFlags.revenueAutomationV1) {
    return NextResponse.json({ error: "FEATURE_REVENUE_AUTOMATION_V1 off" }, { status: 403 });
  }

  try {
    const snapshot = await buildMoneyOperatingSystemSnapshot();
    return NextResponse.json({
      cycle: snapshot.automationCycle ?? null,
      ranAt: snapshot.generatedAt,
    });
  } catch (e) {
    console.error("[revenue-automation/run]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
