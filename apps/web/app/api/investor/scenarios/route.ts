import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { simulateInvestmentScenario } from "@/modules/investor-intelligence/scenario-simulator.service";
import type { ExpansionScenarioInput } from "@/modules/investor-intelligence/investor-intelligence.types";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

const ALLOW = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

export async function GET(_req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u || !ALLOW.has(u.role)) {
      return NextResponse.json({ ok: false, error: "Forbidden", scenarios: null }, { status: 403 });
    }
    if (!engineFlags.investorIntelligenceV1) {
      return NextResponse.json({ ok: true, scenarios: [], message: "Feature off" });
    }
    const rows = await prisma.expansionScenario
      .findMany({ where: { status: { in: ["DRAFT", "ACTIVE"] } }, take: 50, orderBy: { updatedAt: "desc" } })
      .catch(() => [] as { id: string; scenarioKey: string; marketKey: string; status: string; assumptionsJson: unknown; projectedImpactJson: unknown }[]);
    return NextResponse.json({ ok: true, scenarios: rows, disclaimer: "Assumptions are historical; not accounting records." });
  } catch {
    return NextResponse.json(
      { ok: false, error: "unavailable", scenarios: null, disclaimer: "Heuristic; not a prediction of returns." },
      { status: 200 }
    );
  }
}

type Body = Partial<ExpansionScenarioInput> & { persist?: boolean; assumptions?: Record<string, string | number | boolean> };

export async function POST(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u || !ALLOW.has(u.role)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    if (!engineFlags.investorIntelligenceV1) {
      return NextResponse.json(
        { ok: false, error: "Feature disabled", result: null, disclaimer: "Set FEATURE_INVESTOR_INTELLIGENCE_V1" },
        { status: 200 }
      );
    }
    const raw = (await req.json().catch(() => ({}))) as Body;
    if (!raw.marketKey || !raw.action) {
      return NextResponse.json(
        { ok: false, error: "marketKey and action required", result: null },
        { status: 200 }
      );
    }
    const input: ExpansionScenarioInput = {
      marketKey: String(raw.marketKey),
      segmentKey: raw.segmentKey ? String(raw.segmentKey) : undefined,
      action: raw.action as ExpansionScenarioInput["action"],
      assumptions: (raw.assumptions as Record<string, string | number | boolean>) ?? {},
    };
    const result = await simulateInvestmentScenario(input, userId);
    if (raw.persist === false) {
      /* no-op: simulator already best-effort writes DRAFT; optional future: skip */
    }
    return NextResponse.json({ ok: true, result, disclaimer: result.disclaimer });
  } catch {
    return NextResponse.json(
      { ok: false, error: "unavailable", result: null, disclaimer: "Heuristic; not a prediction of returns." },
      { status: 200 }
    );
  }
}
