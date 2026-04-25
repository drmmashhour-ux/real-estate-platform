import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { getInvestorDashboardBundle } from "@/src/modules/analytics/investor/analytics.engine";

export const dynamic = "force-dynamic";

/** GET /api/admin/analytics/investor — full investor intelligence bundle (admin). */
export async function GET(req: Request) {
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await requireAdminUser(viewerId))) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const days = Number(new URL(req.url).searchParams.get("days") ?? "30") || 30;
  const data = await getInvestorDashboardBundle(Math.min(365, Math.max(7, days)));
  if (!data.ok) {
    return NextResponse.json({ error: data.error }, { status: 403 });
  }
  return NextResponse.json(data);
}
