import { NextResponse } from "next/server";
import { requireAdminDashboardApi } from "@/lib/senior-dashboard/api-auth";
import { getCommandAlerts } from "@/modules/senior-living/command/senior-command.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminDashboardApi();
  if (!auth.ok) return auth.response;
  const alerts = await getCommandAlerts();
  return NextResponse.json({ alerts }, { headers: { "Cache-Control": "private, no-store" } });
}
