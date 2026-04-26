import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { buildInvestorSnapshot } from "@/modules/investor-intelligence/investor-snapshot.service";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

const ALLOW = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

export async function GET(_req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u || !ALLOW.has(u.role)) {
      return NextResponse.json(
        { ok: false, error: "Forbidden", snapshot: null, disclaimer: "Broker or admin only; not a retail investor statement." },
        { status: 403 }
      );
    }
    if (!engineFlags.investorIntelligenceV1) {
      return NextResponse.json(
        {
          ok: true,
          snapshot: null,
          featureDisabled: true,
          message: "Set FEATURE_INVESTOR_INTELLIGENCE_V1 to load full snapshot.",
          disclaimer: "Not audited financials; not a valuation; operational intelligence only.",
        },
        { status: 200 }
      );
    }
    const bundle = await buildInvestorSnapshot("30d_rolling_v1", { writeDb: u.role === "ADMIN" });
    const { expansion, alertItems, roi, ...snapshot } = bundle;
    return NextResponse.json(
      {
        ok: true,
        snapshot,
        expansion,
        alerts: alertItems,
        roiSample: roi.slice(0, 40),
        disclaimer: snapshot.disclaimer + " Traces: " + (snapshot.dataSources ?? []).join(" · "),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "unavailable", snapshot: null, disclaimer: "Heuristic; not a prediction of returns." },
      { status: 200 }
    );
  }
}
