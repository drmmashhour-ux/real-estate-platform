import { NextResponse } from "next/server";
import { engineFlags, revenueEnforcementFlags } from "@/config/feature-flags";
import { buildRevenueDashboardSummary } from "@/modules/revenue/revenue-dashboard.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

/**
 * Read-only revenue dashboard summary for Growth Machine operators.
 * Requires growth machine auth and either revenue dashboard V1 or growth revenue panel flag.
 */
export async function GET() {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  if (!revenueEnforcementFlags.revenueDashboardV1 && !engineFlags.growthRevenuePanelV1) {
    return NextResponse.json({ error: "Revenue dashboard disabled" }, { status: 403 });
  }

  try {
    const summary = await buildRevenueDashboardSummary();
    return NextResponse.json({ summary });
  } catch (e) {
    console.error("[growth/revenue]", e);
    return NextResponse.json({ error: "Failed to load revenue summary" }, { status: 500 });
  }
}
