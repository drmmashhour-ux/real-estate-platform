import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { runDealCloser } from "@/modules/deal-closer/deal-closer.engine";
import { buildDealCloserContext } from "@/modules/deal-closer/deal-closer-context.service";
import { recordCloseActionAssignment } from "@/modules/deal-closer/close-action-assignment.service";
import { applyDealCloserLearningNudge } from "@/modules/strategy-benchmark/learning-nudges.service";
import { maybeApplyReinforcementToCloser } from "@/modules/reinforcement/reinforcement-wiring.service";

export const dynamic = "force-dynamic";

const BROKER_LIKE = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

type Params = { params: Promise<{ id: string }> };

/**
 * Broker deal closer: readiness, blockers, next actions, premature push risk. Suggestion-only; never auto-executes.
 */
export async function GET(_req: NextRequest, context: Params) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 401 });
    if (!BROKER_LIKE.has(user.role)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { id: dealId } = await context.params;
    const deal = await prisma.deal.findFirst({
      where: user.role === "ADMIN" ? { id: dealId } : { id: dealId, brokerId: userId },
      select: { id: true, brokerId: true },
    });
    if (!deal) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const brokerForContext = deal.brokerId ?? userId;
    const ctx = await buildDealCloserContext({ dealId, brokerId: brokerForContext });
    const raw = runDealCloser(ctx);
    const nextActions = await applyDealCloserLearningNudge(raw.nextActions);
    const nudged = { ...raw, nextActions };
    const closer = await maybeApplyReinforcementToCloser(ctx, nudged);
    const top = closer.nextActions[0];
    if (top) {
      void recordCloseActionAssignment({
        userId,
        dealId,
        topActionKey: top.key,
        detail: { readiness: closer.readiness.label, pushRisk: closer.prematurePushRisk },
      });
    }

    return NextResponse.json(
      {
        ok: true,
        closer: {
          readiness: closer.readiness,
          blockers: closer.blockers,
          nextActions: closer.nextActions,
          prematurePushRisk: closer.prematurePushRisk,
          closeStrategy: closer.closeStrategy,
          coachNotes: closer.coachNotes,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "unavailable",
        closer: {
          readiness: { score: 0, label: "not_ready" as const, rationale: ["Service unavailable."] },
          blockers: [],
          nextActions: [] as { key: string; title: string; priority: "low"; rationale: string[] }[],
          prematurePushRisk: "high" as const,
          closeStrategy: ["Review the deal manually."],
          coachNotes: ["No automated action was taken."],
        },
      },
      { status: 200 }
    );
  }
}
