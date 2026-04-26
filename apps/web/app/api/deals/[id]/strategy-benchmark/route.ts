import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getDealStrategyBenchmarkView } from "@/modules/strategy-benchmark/deal-strategy-insights.service";

export const dynamic = "force-dynamic";

const BROKER_LIKE = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);
type P = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: P) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u) return NextResponse.json({ ok: false, error: "Not found" }, { status: 401 });
    if (!BROKER_LIKE.has(u.role)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    const { id: dealId } = await ctx.params;
    const deal = await prisma.deal.findFirst({
      where: u.role === "ADMIN" ? { id: dealId } : { id: dealId, brokerId: userId },
      select: { id: true },
    });
    if (!deal) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    const view = await getDealStrategyBenchmarkView(dealId);
    return NextResponse.json({ ok: true, benchmark: view }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable", benchmark: null }, { status: 200 });
  }
}
