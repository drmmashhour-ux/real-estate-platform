import { NextResponse } from "next/server";
import type { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { brokerTeamViewFlags, brokerTeamViewPanelFlags } from "@/config/feature-flags";
import { buildBrokerTeamDashboardPayload } from "@/modules/broker/team/broker-team.service";

const ADMIN_SURFACE_ROLES = new Set<PlatformRole>(["ADMIN", "ACCOUNTANT"]);

export const dynamic = "force-dynamic";

/** Internal broker team coaching dashboard — admin/accountant only. */
export async function GET() {
  if (!brokerTeamViewFlags.brokerTeamViewV1 || !brokerTeamViewPanelFlags.brokerTeamViewPanelV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || !ADMIN_SURFACE_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await buildBrokerTeamDashboardPayload({ maxBrokers: 48 });

  return NextResponse.json(payload);
}
