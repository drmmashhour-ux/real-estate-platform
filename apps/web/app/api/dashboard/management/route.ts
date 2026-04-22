import { NextResponse } from "next/server";
import { requireManagementDashboardApi } from "@/lib/senior-dashboard/api-auth";
import { getManagementDashboardPayload } from "@/modules/senior-living/dashboard/management-dashboard.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireManagementDashboardApi();
  if (!auth.ok) return auth.response;

  const residenceIds =
    auth.access.kind === "platform_admin" ? ("all" as const) : auth.access.residenceIds;

  const payload = await getManagementDashboardPayload({
    userId: auth.userId,
    residenceIds,
  });

  return NextResponse.json(payload, { headers: { "Cache-Control": "private, no-store" } });
}
