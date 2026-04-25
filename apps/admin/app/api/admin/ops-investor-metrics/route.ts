import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canAccessInvestorDashboard } from "@/lib/investor/access";
import { fetchInvestorMetricsSnapshot, parseInvestorTimeWindow } from "@/lib/investor/metrics";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const uid = await getGuestId();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canAccessInvestorDashboard(uid))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const window = parseInvestorTimeWindow(searchParams.get("window") ?? undefined);

  const snapshot = await fetchInvestorMetricsSnapshot(window);
  return NextResponse.json(snapshot);
}
