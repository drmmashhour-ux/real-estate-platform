import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getUsageMetrics, parseAdminRange } from "@/modules/analytics/services/admin-analytics-service";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const viewerId = await getGuestId();
  if (!viewerId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const admin = await requireAdminUser(viewerId);
  if (!admin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const range = parseAdminRange({
    range: sp.get("range"),
    from: sp.get("from"),
    to: sp.get("to"),
  });
  const data = await getUsageMetrics(range);
  return NextResponse.json(data);
}
