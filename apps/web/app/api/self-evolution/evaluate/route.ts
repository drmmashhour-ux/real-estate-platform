import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { engineFlags } from "@/config/feature-flags";
import { evaluateProposalInSandbox } from "@/modules/self-evolution/sandbox-evaluator.service";

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
      return NextResponse.json({ ok: true, featureDisabled: true, result: null }, { status: 200 });
    }
    const body = (await req.json().catch(() => ({}))) as { proposalId?: string };
    if (!body.proposalId) {
      return NextResponse.json({ ok: false, error: "proposalId required" }, { status: 200 });
    }
    const result = await evaluateProposalInSandbox(body.proposalId);
    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, result: null }, { status: 200 });
  }
}
