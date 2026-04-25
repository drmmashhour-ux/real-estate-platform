import { NextRequest, NextResponse } from "next/server";
import { PlatformRole, type StrategyBenchmarkDomain } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { selectStrategyWithReinforcement } from "@/modules/reinforcement/reinforcement.engine";
import type { ReinforcementCandidate, ReinforcementContextInput } from "@/modules/reinforcement/reinforcement.types";

export const dynamic = "force-dynamic";

const BROKER_LIKE = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);
const DOMAINS = new Set<StrategyBenchmarkDomain>(["NEGOTIATION", "CLOSING", "OFFER"]);

type Body = {
  domain?: string;
  candidates?: ReinforcementCandidate[];
  context?: ReinforcementContextInput;
  dealId?: string | null;
  conversationId?: string | null;
  auditRoll?: number;
};

export async function POST(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, id: true } });
    if (!u) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    if (!BROKER_LIKE.has(u.role)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    const raw = (await req.json().catch(() => ({}))) as Body;
    const domain = (raw.domain ?? "OFFER") as StrategyBenchmarkDomain;
    if (!DOMAINS.has(domain)) {
      return NextResponse.json(
        { ok: false, error: "Invalid domain", result: null, disclaimer: "Advisory, rank-only, no auto-execution." },
        { status: 200 }
      );
    }
    if (!raw.candidates?.length) {
      return NextResponse.json({ ok: false, error: "candidates required", result: null }, { status: 200 });
    }
    const r = await selectStrategyWithReinforcement({
      domain,
      candidates: raw.candidates,
      context: raw.context ?? {},
      dealId: raw.dealId,
      conversationId: raw.conversationId,
      brokerId: u.id,
      auditRoll: raw.auditRoll,
    });
    return NextResponse.json(
      {
        ok: true,
        result: r,
        disclaimer: "Ranking aid only; does not send messages or file offers. Bounded exploration; auditable in reinforcement_decisions.",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "unavailable", result: null, disclaimer: "Heuristic; not a prediction." },
      { status: 200 }
    );
  }
}
