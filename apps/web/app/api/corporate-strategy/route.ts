import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { buildCorporateStrategySnapshot } from "@/modules/corporate-strategy/corporate-strategy.service";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

const ALLOW = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

function briefPayload(view: Awaited<ReturnType<typeof buildCorporateStrategySnapshot>>) {
  return {
    periodKey: view.periodKey,
    generatedAt: view.generatedAt,
    summary: view.summary,
    disclaimer: view.disclaimer,
    quarterly: { topPriorities: view.quarterly.topPriorities, disclaimer: view.quarterly.disclaimer },
    bottlenecksHeadline: view.bottlenecks[0]?.title ?? null,
    riskHeadline: view.risks[0]?.message ?? null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u || !ALLOW.has(u.role)) {
      return NextResponse.json(
        { ok: false, error: "Forbidden", disclaimer: "Broker or admin only. Advisory, not a promise of outcomes." },
        { status: 403 }
      );
    }
    if (!engineFlags.corporateStrategyV1) {
      return NextResponse.json(
        {
          ok: true,
          featureDisabled: true,
          message: "Set FEATURE_CORPORATE_STRATEGY_V1=1 to load the full strategy snapshot.",
          strategy: null,
          disclaimer: "Advisory decision-support only. No automatic hiring or financial execution.",
        },
        { status: 200 }
      );
    }
    const sp = new URL(req.url).searchParams;
    const summaryOnly = sp.get("summaryOnly") === "1" || sp.get("brief") === "1";
    const view = await buildCorporateStrategySnapshot("90d_rolling_v1", { writeDb: u.role === "ADMIN" });
    if (summaryOnly) {
      return NextResponse.json(
        { ok: true, strategy: briefPayload(view), disclaimer: view.disclaimer, brief: true },
        { status: 200 }
      );
    }
    return NextResponse.json(
      { ok: true, strategy: view, disclaimer: view.disclaimer, advisory: true as const },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "unavailable",
        strategy: null,
        disclaimer: "Advisory only. Service temporarily unavailable; nothing has been auto-executed.",
      },
      { status: 200 }
    );
  }
}
