import { NextResponse } from "next/server";
import { requireAdminDashboardApi } from "@/lib/senior-dashboard/api-auth";
import { getAreaInsights } from "@/modules/senior-living/command/senior-command.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminDashboardApi();
  if (!auth.ok) return auth.response;
  const areas = await getAreaInsights();
  return NextResponse.json({ cities: areas }, { headers: { "Cache-Control": "private, no-store" } });
}
