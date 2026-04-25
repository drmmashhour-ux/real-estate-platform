import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { engineFlags } from "@/config/feature-flags";
import { generateEvolutionProposals } from "@/modules/self-evolution/proposal-generator.engine";

export const dynamic = "force-dynamic";

const ALLOW = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

export async function GET() {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u || !ALLOW.has(u.role)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    if (!engineFlags.selfEvolutionV1) {
      return NextResponse.json({ ok: true, featureDisabled: true, proposals: [], message: "FEATURE_SELF_EVOLUTION_V1" }, { status: 200 });
    }
    const proposals = await prisma.evolutionProposal.findMany({ take: 80, orderBy: { createdAt: "desc" } });
    return NextResponse.json(
      { ok: true, proposals, disclaimer: "Internal evolution ledger; no automatic legal/ compliance / financial change." },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable", proposals: [] }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u || u.role !== PlatformRole.ADMIN) {
      return NextResponse.json({ ok: false, error: "Admin only" }, { status: 403 });
    }
    if (!engineFlags.selfEvolutionV1) {
      return NextResponse.json({ ok: true, featureDisabled: true, ids: [] }, { status: 200 });
    }
    const body = (await req.json().catch(() => ({}))) as { persist?: boolean };
    const ids = await generateEvolutionProposals({ persist: body.persist === true, generatedBy: "SYSTEM" });
    return NextResponse.json({ ok: true, createdIds: ids }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, createdIds: [] }, { status: 200 });
  }
}
