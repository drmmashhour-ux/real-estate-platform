import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { computeGrowthFunnelMetrics } from "@/src/modules/growth-funnel/application/computeGrowthFunnelMetrics";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const days = Math.min(90, Math.max(7, Number(searchParams.get("days") || 30)));

  const metrics = await computeGrowthFunnelMetrics(days);
  return NextResponse.json({ metrics });
}
