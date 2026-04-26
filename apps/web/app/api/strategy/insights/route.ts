import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGlobalStrategyInsights } from "@/modules/strategy-benchmark/strategy-performance.service";

export const dynamic = "force-dynamic";

const BROKER_LIKE = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

export async function GET() {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    if (!BROKER_LIKE.has(u.role)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    const { topPerforming, underperforming, mostUsed } = await getGlobalStrategyInsights();
    return NextResponse.json(
      {
        ok: true,
        insights: {
          topPerforming,
          underperforming,
          mostUsed,
        },
        disclaimer: "Heuristic, aggregate product metrics — not deterministic predictions; avoid inferring personal traits from behavior.",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "unavailable", insights: { topPerforming: [], underperforming: [], mostUsed: [] } },
      { status: 200 }
    );
  }
}
