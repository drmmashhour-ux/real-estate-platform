import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { analyzeRoiPerformance, listRoiFromDb } from "@/modules/investor-intelligence/roi-engine.service";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

const ALLOW = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

export async function GET(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u || !ALLOW.has(u.role)) {
      return NextResponse.json({ ok: false, error: "Forbidden", roi: null }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const fromDb = searchParams.get("source") === "db";
    if (!engineFlags.investorIntelligenceV1) {
      return NextResponse.json({
        ok: true,
        roi: [],
        message: "Feature flag off; enable FEATURE_INVESTOR_INTELLIGENCE_V1 for aggregates.",
        disclaimer: "Comparative scores, not a promise of return.",
      });
    }
    const ri = fromDb
      ? await listRoiFromDb(300)
      : await analyzeRoiPerformance({ persist: u.role === "ADMIN", lookbackDays: 150 });
    return NextResponse.json({
      ok: true,
      roi: ri,
      rows: ri.length,
      disclaimer: "Revenue in rows attributes closed-won $ to each slice for comparison (not additive across rows as total P&L).",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "unavailable", roi: null, disclaimer: "Heuristic; not a prediction of returns." },
      { status: 200 }
    );
  }
}
