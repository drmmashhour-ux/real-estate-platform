import { NextResponse } from "next/server";
import type { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { brokerPerformanceFlags } from "@/config/feature-flags";
import { buildInternalBrokerLeaderboard } from "@/modules/broker/performance/broker-leaderboard.service";

const ADMIN_SURFACE_ROLES = new Set<PlatformRole>(["ADMIN", "ACCOUNTANT"]);

export const dynamic = "force-dynamic";

/** Internal execution leaderboard — admin/accountant only; not a public ranking. */
export async function GET() {
  if (!brokerPerformanceFlags.brokerPerformanceV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || !ADMIN_SURFACE_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await buildInternalBrokerLeaderboard({ maxBrokers: 48 });

  return NextResponse.json({
    ...data,
    disclaimer:
      "Internal coaching signal — not verified outcomes, not for public display or punitive HR use.",
  });
}
