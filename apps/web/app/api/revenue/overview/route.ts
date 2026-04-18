import { NextResponse } from "next/server";
import { revenueEnforcementFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { getRevenueEnforcementAlerts } from "@/modules/revenue/revenue-alerts.service";
import { getRevenueMonitoringSnapshot } from "@/modules/revenue/revenue-monitoring.service";

export const dynamic = "force-dynamic";

/**
 * In-memory enforcement snapshot for Growth dashboard (V1).
 */
export async function GET() {
  if (!revenueEnforcementFlags.revenueDashboardV1) {
    return NextResponse.json({ error: "Revenue dashboard V1 is disabled" }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const snapshot = getRevenueMonitoringSnapshot();
  const alerts = getRevenueEnforcementAlerts();

  const unlockRate =
    snapshot.leadViews > 0
      ? Math.round((snapshot.leadsUnlockedPipeline / snapshot.leadViews) * 1000) / 10
      : null;

  return NextResponse.json({
    snapshot,
    alerts,
    unlockRatePercent: unlockRate,
  });
}
