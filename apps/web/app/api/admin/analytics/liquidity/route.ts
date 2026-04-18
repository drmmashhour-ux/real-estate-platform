import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { intelligenceFlags } from "@/config/feature-flags";
import { computeCityLiquiditySnapshots } from "@/src/modules/liquidity/liquidity.engine";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!intelligenceFlags.analyticsDashboardV1 || !intelligenceFlags.liquidityEngineV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 403 });
  }
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await requireAdminUser(viewerId))) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const cities = await computeCityLiquiditySnapshots(40);
  return NextResponse.json({ ok: true, cities });
}
