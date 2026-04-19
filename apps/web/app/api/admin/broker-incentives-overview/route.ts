import { NextResponse } from "next/server";
import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { brokerIncentivesFlags } from "@/config/feature-flags";
import { buildBrokerIncentivesAdminOverview } from "@/modules/broker/incentives/broker-incentives-admin.service";

const ADMIN_SURFACE_ROLES = new Set<PlatformRole>(["ADMIN", "ACCOUNTANT"]);

export const dynamic = "force-dynamic";

export async function GET() {
  if (!brokerIncentivesFlags.brokerIncentivesV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || !ADMIN_SURFACE_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const overview = await buildBrokerIncentivesAdminOverview({ maxBrokers: 36 });

  return NextResponse.json(overview);
}
