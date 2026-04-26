import { NextRequest, NextResponse } from "next/server";
import { PlatformRole, type StrategyBucketOutcome } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { recordStrategyOutcomeFeedback } from "@/modules/reinforcement/feedback.service";

export const dynamic = "force-dynamic";

const BROKER_LIKE = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);
const OUTCOMES = new Set<StrategyBucketOutcome>(["WON", "LOST", "STALLED"]);

type Body = {
  decisionId?: string;
  dealId?: string;
  strategyKey?: string;
  domain?: "NEGOTIATION" | "CLOSING" | "OFFER";
  contextBucket?: string;
  outcome: StrategyBucketOutcome;
  closingTimeDays?: number | null;
};

export async function POST(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    if (!BROKER_LIKE.has(u.role)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    const body = (await req.json().catch(() => ({}))) as Body;
    if (!body.outcome || !OUTCOMES.has(body.outcome)) {
      return NextResponse.json({ ok: false, error: "outcome (WON|LOST|STALLED) required" }, { status: 200 });
    }
    if (body.dealId) {
      const d = await prisma.deal.findFirst({
        where: u.role === "ADMIN" ? { id: body.dealId } : { id: body.dealId, brokerId: userId },
        select: { id: true },
      });
      if (!d) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    const res = await recordStrategyOutcomeFeedback({
      decisionId: body.decisionId,
      dealId: body.dealId,
      strategyKey: body.strategyKey,
      domain: body.domain,
      contextBucket: body.contextBucket,
      outcome: body.outcome,
      closingTimeDays: body.closingTimeDays,
    });
    return NextResponse.json({ ok: true, ...res, disclaimer: "Reward update is aggregate learning only, not a personal credit score." }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable", updated: 0 }, { status: 200 });
  }
}
