import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { getDarlinkAutonomyFlags } from "@/lib/platform-flags";
import { buildMarketplaceAutonomyDashboard } from "@/modules/autonomy/darlink-autonomy-dashboard.service";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const flags = getDarlinkAutonomyFlags();
  if (!flags.AUTONOMY_ENABLED) {
    return NextResponse.json({
      ok: true,
      disabled: true,
      flags,
      dashboard: null,
    });
  }
  const dashboard = await buildMarketplaceAutonomyDashboard();
  return NextResponse.json({ ok: true, disabled: false, flags, dashboard });
}
