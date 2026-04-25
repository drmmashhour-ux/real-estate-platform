import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getRecentActivityFeed } from "@/modules/analytics/services/admin-analytics-service";
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

  const take = Math.min(parseInt(req.nextUrl.searchParams.get("take") ?? "25", 10) || 25, 50);
  const items = await getRecentActivityFeed(take);
  return NextResponse.json({ items });
}
