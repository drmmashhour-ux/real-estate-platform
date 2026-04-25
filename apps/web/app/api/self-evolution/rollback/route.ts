import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { engineFlags } from "@/config/feature-flags";
import { evaluateRollbackNeed, rollbackPromotedChange } from "@/modules/self-evolution/rollback-engine.service";

export const dynamic = "force-dynamic";

const ALLOW = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

export async function POST(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u || !ALLOW.has(u.role)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    if (!engineFlags.selfEvolutionV1) {
      return NextResponse.json({ ok: true, featureDisabled: true }, { status: 200 });
    }
    const body = (await req.json().catch(() => ({}))) as { proposalId?: string; action?: "evaluate" | "rollback"; force?: boolean; reason?: string };
    if (!body.proposalId) {
      return NextResponse.json({ ok: false, error: "proposalId" }, { status: 200 });
    }
    if (body.action === "evaluate") {
      const ev = await evaluateRollbackNeed(body.proposalId);
      return NextResponse.json({ ok: true, evaluation: ev }, { status: 200 });
    }
    if (u.role === "BROKER" && body.force) {
      return NextResponse.json({ ok: false, error: "only admin can force" }, { status: 200 });
    }
    const r = await rollbackPromotedChange(body.proposalId, { actorUserId: userId, reason: body.reason, force: body.force === true });
    return NextResponse.json({ ok: r.ok, message: r.message }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
