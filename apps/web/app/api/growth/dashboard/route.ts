import { NextResponse } from "next/server";
import { buildGrowthDashboardPayload } from "@/modules/growth-reporting";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;
  const payload = await buildGrowthDashboardPayload({ userId: auth.userId, role: auth.role });
  return NextResponse.json(payload);
}
