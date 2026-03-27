import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { getGrowthTrackingDashboard } from "@/modules/analytics/services/growth-tracking-dashboard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  const admin = await requireAdminUser(userId);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const daysRaw = Number(new URL(request.url).searchParams.get("days") ?? "30");
  const days = Number.isFinite(daysRaw) ? Math.max(1, Math.min(180, Math.trunc(daysRaw))) : 30;
  const data = await getGrowthTrackingDashboard(days);
  return NextResponse.json(data);
}
