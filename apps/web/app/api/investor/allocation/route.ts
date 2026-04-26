import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { generateCapitalAllocationRecommendations } from "@/modules/investor-intelligence/capital-allocation.engine";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

const ALLOW = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

export async function GET(_req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u || !ALLOW.has(u.role)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    if (!engineFlags.investorIntelligenceV1) {
      return NextResponse.json({
        ok: true,
        recommendations: [],
        fromDb: [],
        message: "Set FEATURE_INVESTOR_INTELLIGENCE_V1 to compute recommendations.",
        disclaimer: "Suggestions, not auto-budget; confirm with finance.",
      });
    }
    const recs = await generateCapitalAllocationRecommendations();
    let fromDb: unknown[] = [];
    try {
      fromDb = await prisma.capitalAllocationRecommendation.findMany({
        where: { status: "ACTIVE" },
        take: 100,
        orderBy: { updatedAt: "desc" },
      });
    } catch {
      /* */
    }
    return NextResponse.json({
      ok: true,
      recommendations: recs,
      fromDb,
      disclaimer: "Capital allocation is advisory; does not reallocate real budgets in ERP.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "unavailable", recommendations: null, disclaimer: "Heuristic; not a prediction of returns." },
      { status: 200 }
    );
  }
}
