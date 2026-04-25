import { NextRequest, NextResponse } from "next/server";
import { PlatformRole, type StrategyBenchmarkDomain } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { getArmsByBucket, getReinforcementDashboardInsights } from "@/modules/reinforcement/reinforcement-insights.service";

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
    const domain = (searchParams.get("domain") ?? "") as StrategyBenchmarkDomain;
    const bucket = searchParams.get("contextBucket")?.trim() ?? "";
    if (domain && DOMAINS.has(domain) && bucket) {
      const byBucket = await getArmsByBucket(domain, bucket);
      return NextResponse.json(
        { ok: true, domain, contextBucket: bucket, arms: byBucket, disclaimer: "Aggregate, explore/exploit mix is observational, not a guarantee." },
        { status: 200 }
      );
    }
    const dash = await getReinforcementDashboardInsights();
    return NextResponse.json({ ok: true, dashboard: dash, disclaimer: "Product learning metrics, not user profiling; avoid bias amplification in interpretation." }, { status: 200 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "unavailable", dashboard: null },
      { status: 200 }
    );
  }
}
