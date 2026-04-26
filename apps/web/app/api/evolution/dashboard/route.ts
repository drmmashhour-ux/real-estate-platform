import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { buildEvolutionDashboardSnapshot } from "@/modules/evolution/evolution-dashboard.service";
import { getEvolutionMonitoringSnapshot } from "@/modules/evolution/evolution-monitoring.service";
import type { EvolutionDomain } from "@/modules/evolution/evolution.types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (
    me?.role !== PlatformRole.ADMIN &&
    me?.role !== PlatformRole.BROKER &&
    me?.role !== PlatformRole.INVESTOR
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const domain = req.nextUrl.searchParams.get("domain") as EvolutionDomain | null;
  const monitoring = req.nextUrl.searchParams.get("monitoring") === "1";

  try {
    const snapshot = await buildEvolutionDashboardSnapshot(domain ?? undefined);
    const extra = monitoring && me?.role === PlatformRole.ADMIN ? await getEvolutionMonitoringSnapshot() : null;

    return NextResponse.json({
      ...snapshot,
      ...(extra ? { monitoring: extra } : {}),
    });
  } catch {
    return NextResponse.json({ error: "Unable to load evolution dashboard" }, { status: 500 });
  }
}
