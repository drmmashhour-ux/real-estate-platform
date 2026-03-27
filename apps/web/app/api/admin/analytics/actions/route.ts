import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getPendingActionsSummary } from "@/modules/analytics/services/admin-analytics-service";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const viewerId = await getGuestId();
  if (!viewerId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const admin = await requireAdminUser(viewerId);
  if (!admin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const data = await getPendingActionsSummary();
  return NextResponse.json(data);
}
