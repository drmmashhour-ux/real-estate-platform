import { NextRequest, NextResponse } from "next/server";
import { PlatformRole, type StrategyBenchmarkDomain } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { getStrategyPerformance } from "@/modules/strategy-benchmark/strategy-performance.service";

export const dynamic = "force-dynamic";

const BROKER_LIKE = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);
const DOMAINS = new Set<StrategyBenchmarkDomain>(["NEGOTIATION", "CLOSING", "OFFER"]);

export async function GET(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    if (!BROKER_LIKE.has(u.role)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const key = (searchParams.get("strategyKey") ?? "").trim();
    const d = (searchParams.get("domain") ?? "OFFER").trim() as StrategyBenchmarkDomain;
    if (!key) return NextResponse.json({ ok: true, performance: null, message: "strategyKey required" });
    if (!DOMAINS.has(d)) {
      return NextResponse.json({ ok: true, performance: null, message: "Invalid domain" });
    }
    const p = await getStrategyPerformance(key, d);
    return NextResponse.json(
      { ok: true, performance: { ...p, disclaimer: "Probabilistic, aggregate-only — not a personal score." } },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable", performance: null }, { status: 200 });
  }
}
