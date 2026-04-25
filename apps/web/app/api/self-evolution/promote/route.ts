import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { engineFlags } from "@/config/feature-flags";
import { autoPromoteIfAllowed, promoteProposal, rejectProposal } from "@/modules/self-evolution/promotion-governor.service";

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
    const body = (await req.json().catch(() => ({}))) as { proposalId?: string; action?: "promote" | "auto" | "reject"; reason?: string };
    if (!body.proposalId) {
      return NextResponse.json({ ok: false, error: "proposalId" }, { status: 200 });
    }
    if (body.action === "reject") {
      if (u.role !== "ADMIN" && u.role !== "BROKER") {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 200 });
      }
      const r = await rejectProposal(body.proposalId, userId, body.reason ?? "rejected");
      return NextResponse.json({ ok: r.ok, message: r.message }, { status: 200 });
    }
    if (body.action === "auto") {
      if (u.role !== "ADMIN") {
        return NextResponse.json({ ok: false, error: "admin for auto" }, { status: 200 });
      }
      const r = await autoPromoteIfAllowed(body.proposalId);
      return NextResponse.json({ ok: r.ok, message: r.message }, { status: 200 });
    }
    const r = await promoteProposal(body.proposalId, { actorUserId: userId, useAutoPath: false });
    return NextResponse.json({ ok: r.ok, message: r.message }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
