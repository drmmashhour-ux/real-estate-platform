import { NextResponse } from "next/server";
import { requireAdminSurfaceSession } from "@/lib/admin/require-admin-surface-session";
import { revenueAutomationFlags } from "@/config/feature-flags";
import { buildGlobalMoneyOsView } from "@/modules/revenue/global-money-os.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSurfaceSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!revenueAutomationFlags.globalMosV1) {
    return NextResponse.json(
      { error: "FEATURE_GLOBAL_MOS_V1 disabled", code: "GLOBAL_MOS_DISABLED" },
      { status: 403 },
    );
  }

  try {
    const view = await buildGlobalMoneyOsView();
    return NextResponse.json({ view });
  } catch (e) {
    console.error("[admin/global-money]", e);
    return NextResponse.json({ error: "Failed to build global money view" }, { status: 500 });
  }
}
