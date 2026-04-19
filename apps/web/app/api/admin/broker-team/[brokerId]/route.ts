import { NextResponse } from "next/server";
import type { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { brokerTeamViewFlags, brokerTeamViewPanelFlags } from "@/config/feature-flags";
import { buildBrokerTeamManagerDetail } from "@/modules/broker/team/broker-team.service";

const ADMIN_SURFACE_ROLES = new Set<PlatformRole>(["ADMIN", "ACCOUNTANT"]);

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ brokerId: string }> }) {
  if (!brokerTeamViewFlags.brokerTeamViewV1 || !brokerTeamViewPanelFlags.brokerTeamViewPanelV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || !ADMIN_SURFACE_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { brokerId } = await ctx.params;
  const detail = await buildBrokerTeamManagerDetail(brokerId, { emitMonitoring: true });
  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
