import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PlatformRole } from "@prisma/client";
import { buildLeaderboard } from "@/modules/gamification/broker-leaderboard.service";
import type { LeaderboardScope, LeaderboardWindow } from "@/modules/gamification/broker-gamification.types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!me || me.role !== PlatformRole.BROKER) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const scope = (sp.get("scope") as LeaderboardScope) ?? "GLOBAL";
  const window = (sp.get("window") as LeaderboardWindow) ?? "MONTHLY";
  const city = sp.get("city") ?? undefined;
  const agency = sp.get("agency") ?? undefined;
  const take = Math.min(Number(sp.get("take") ?? "50") || 50, 100);

  const rows = await buildLeaderboard({
    scope: scope === "CITY" || scope === "AGENCY" || scope === "GLOBAL" ? scope : "GLOBAL",
    window,
    city: scope === "CITY" ? city : undefined,
    agency: scope === "AGENCY" ? agency : undefined,
    take,
  });

  return NextResponse.json({ ok: true, rows });
}
