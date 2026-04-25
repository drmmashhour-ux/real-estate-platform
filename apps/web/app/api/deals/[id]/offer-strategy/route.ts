import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { runOfferStrategy } from "@/modules/offer-strategy/offer-strategy.engine";
import { buildOfferStrategyContext } from "@/modules/offer-strategy/offer-strategy-context.service";
import { recordOfferStrategyAssignment } from "@/modules/offer-strategy/offer-strategy-assignment.service";
import { applyOfferStrategyLearningNudge } from "@/modules/strategy-benchmark/learning-nudges.service";
import { maybeApplyReinforcementToOffer } from "@/modules/reinforcement/reinforcement-wiring.service";

export const dynamic = "force-dynamic";

const BROKER_LIKE = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

type Params = { params: Promise<{ id: string }> };

/**
 * GET offer strategy (readiness, posture, blockers, competitive risk, actions). Suggestions only; no offer submission.
 */
export async function GET(_req: NextRequest, context: Params) {
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
    const brokerFor = deal.brokerId ?? userId;
    const ctx = await buildOfferStrategyContext({ dealId, brokerId: brokerFor });
    const nudged = await applyOfferStrategyLearningNudge(runOfferStrategy(ctx));
    const strategy = await maybeApplyReinforcementToOffer("OFFER", ctx, nudged);
    if (strategy.recommendations[0]) {
      void recordOfferStrategyAssignment({
        userId,
        dealId,
        topRecKey: strategy.recommendations[0]!.key,
        detail: { posture: strategy.posture.style, readiness: strategy.readiness.label },
      });
    }
    return NextResponse.json({ ok: true, strategy }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "unavailable",
        strategy: {
          readiness: { score: 0, label: "not_ready" as const, rationale: ["Unavailable."] },
          posture: { style: "soft_explore" as const, rationale: [], warnings: [] },
          blockers: [] as { key: string; label: string; severity: "low" | "medium" | "high"; rationale: string[] }[],
          competitiveRisk: { level: "medium" as const, rationale: [] },
          recommendations: [] as { key: string; title: string; priority: "low"; rationale: string[] }[],
          coachNotes: [] as string[],
        },
      },
      { status: 200 }
    );
  }
}
