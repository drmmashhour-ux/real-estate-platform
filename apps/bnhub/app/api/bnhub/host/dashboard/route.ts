import { NextRequest, NextResponse } from "next/server";
import { GET as bnhubDashboardGet } from "../../dashboard/route";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { bnhubV2Flags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

/**
 * Host-scoped dashboard — extends `/api/bnhub/dashboard` with autopilot settings when BNHub v2 flags are on.
 */
export async function GET(request: NextRequest) {
  const res = await bnhubDashboardGet(request);
  if (!bnhubV2Flags.bnhubV2 || !bnhubV2Flags.bnhubAutopilotV1) {
    return res;
  }
  try {
    const body = await res.json();
    const userId = await getGuestId();
    if (!userId) return NextResponse.json(body);
    const hostAutopilot = await prisma.hostAutopilotSettings.findUnique({
      where: { hostId: userId },
    });
    return NextResponse.json({ ...body, hostAutopilot });
  } catch {
    return res;
  }
}
