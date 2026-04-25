import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { runNegotiationSimulator } from "@/modules/negotiation-simulator/negotiation-simulator.engine";
import { buildNegotiationSimulatorContext } from "@/modules/negotiation-simulator/negotiation-simulator-context.service";
import {
  recordNegotiationStrategyAssignment,
  recordNegotiationStrategyUsageEvent,
} from "@/modules/negotiation-simulator/negotiation-strategy-assignment.service";
import { applyNegotiationScenarioNudges } from "@/modules/strategy-benchmark/learning-nudges.service";
import { maybeApplyReinforcementToNegotiation } from "@/modules/reinforcement/reinforcement-wiring.service";
import { trackStrategyExecution } from "@/modules/strategy-benchmark/strategy-tracking.service";

export const dynamic = "force-dynamic";

const BROKER_LIKE = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

type Params = { params: Promise<{ id: string }> };

const emptySim = {
  scenarios: [] as Awaited<ReturnType<typeof runNegotiationSimulator>>["scenarios"],
  safestApproach: null as string | null,
  highestUpsideApproach: null as string | null,
  momentumRisk: { level: "low" as const, rationale: [] as string[] },
  objectionForecast: { likelyObjections: [] as { type: string; probabilityBand: "low" | "medium" | "high"; rationale: string[] }[] },
  coachNotes: [] as string[],
};

/**
 * GET — scenario-based negotiation paths; suggestions only; not legal advice; no auto actions.
 */
export async function GET(_req: NextRequest, context: Params) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required", simulator: emptySim }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found", simulator: emptySim }, { status: 401 });
    if (!BROKER_LIKE.has(user.role)) return NextResponse.json({ ok: false, error: "Forbidden", simulator: emptySim }, { status: 403 });
    const { id: dealId } = await context.params;
    const deal = await prisma.deal.findFirst({
      where: user.role === "ADMIN" ? { id: dealId } : { id: dealId, brokerId: userId },
      select: { id: true, brokerId: true },
    });
    if (!deal) return NextResponse.json({ ok: false, error: "Not found", simulator: emptySim }, { status: 404 });
    const brokerFor = deal.brokerId ?? userId;
    const nctx = await buildNegotiationSimulatorContext({ dealId, brokerId: brokerFor });
    const base = runNegotiationSimulator(nctx);
    const nudged = await applyNegotiationScenarioNudges(base.scenarios, "NEGOTIATION");
    const withSim = { ...base, scenarios: nudged };
    const simulator = await maybeApplyReinforcementToNegotiation(nctx, withSim);
    void recordNegotiationStrategyAssignment({
      userId,
      dealId,
      safestApproach: simulator.safestApproach,
      highestUpsideApproach: simulator.highestUpsideApproach,
      detail: { momentum: simulator.momentumRisk.level },
    });
    return NextResponse.json(
      { ok: true, simulator: { ...simulator } },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "unavailable",
        simulator: emptySim,
      },
      { status: 200 }
    );
  }
}

type Body = { action?: "record_strategy"; approachKey?: string };

/**
 * POST — record that the broker is focusing on a suggested path (suggestion only; for learning, not auto-send).
 */
export async function POST(req: NextRequest, context: Params) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 401 });
    if (!BROKER_LIKE.has(user.role)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    const { id: dealId } = await context.params;
    const deal = await prisma.deal.findFirst({
      where: user.role === "ADMIN" ? { id: dealId } : { id: dealId, brokerId: userId },
      select: { id: true, brokerId: true },
    });
    if (!deal) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    const raw = (await req.json().catch(() => ({}))) as Body;
    if (raw.action !== "record_strategy" || !raw.approachKey || typeof raw.approachKey !== "string") {
      return NextResponse.json({ ok: true, received: false }, { status: 200 });
    }
    const key = raw.approachKey.slice(0, 64);
    await recordNegotiationStrategyUsageEvent({ userId, dealId, chosenApproachKey: key });
    void trackStrategyExecution({
      strategyKey: key,
      domain: "NEGOTIATION",
      dealId,
      brokerId: userId,
      contextSnapshot: { event: "broker_confirmed_approach", source: "negotiation_simulator" },
    });
    return NextResponse.json({ ok: true, received: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 200 });
  }
}
