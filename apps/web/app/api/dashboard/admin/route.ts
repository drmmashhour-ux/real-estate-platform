import { NextResponse } from "next/server";
import { requireAdminDashboardApi } from "@/lib/senior-dashboard/api-auth";
import { getAdminDashboardPayload } from "@/modules/senior-living/dashboard/admin-dashboard.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminDashboardApi();
  if (!auth.ok) return auth.response;

  const payload = await getAdminDashboardPayload();
  return NextResponse.json(payload, { headers: { "Cache-Control": "private, no-store" } });
}
