import { NextResponse } from "next/server";
import type { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { growthEngineV2Flags } from "@/config/feature-flags";
import { buildGrowthEngineV2Summary } from "@/modules/growth/v2/growth-engine-v2.service";

const ADMIN_SURFACE_ROLES = new Set<PlatformRole>(["ADMIN", "ACCOUNTANT"]);

export const dynamic = "force-dynamic";

export async function GET() {
  if (!growthEngineV2Flags.growthEngineV2) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || !ADMIN_SURFACE_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const summary = await buildGrowthEngineV2Summary();
    return NextResponse.json(summary);
  } catch {
    return NextResponse.json({ error: "Summary unavailable" }, { status: 500 });
  }
}
