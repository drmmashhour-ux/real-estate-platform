import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createPolicyVersion, listActivePolicies } from "@/modules/autonomy/policy-store.service";
import type { AutonomyMode, AutonomyRiskLevel, PolicyScopeType } from "@/modules/autonomy/autonomy.types";

export const dynamic = "force-dynamic";

function isAdmin(role: PlatformRole | undefined) {
  return role === PlatformRole.ADMIN;
}

/** GET — active policies (admin full; broker may read global only in future — for now admin). */
export async function GET() {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!isAdmin(me?.role)) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
    const policies = await listActivePolicies();
    return NextResponse.json({ ok: true, policies });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "policies_get_failed", policies: [] },
      { status: 200 }
    );
  }
}

/** POST — new policy version (admin). */
export async function POST(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!isAdmin(me?.role)) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const scopeType = body.scopeType as PolicyScopeType | undefined;
    const scopeKey = typeof body.scopeKey === "string" ? body.scopeKey : "";
    if (!scopeType || !scopeKey) {
      return NextResponse.json({ ok: false, error: "scope_required" }, { status: 200 });
    }

    const r = await createPolicyVersion({
      scopeType,
      scopeKey,
      autonomyMode: (body.autonomyMode as AutonomyMode) ?? "ASSIST",
      allowedActionTypes: Array.isArray(body.allowedActionTypes) ? (body.allowedActionTypes as string[]) : [],
      blockedActionTypes: Array.isArray(body.blockedActionTypes) ? (body.blockedActionTypes as string[]) : [],
      maxRiskLevel: (body.maxRiskLevel as AutonomyRiskLevel) ?? "MEDIUM",
      requireApprovalFor: Array.isArray(body.requireApprovalFor) ? (body.requireApprovalFor as string[]) : [],
      emergencyFreeze: Boolean(body.emergencyFreeze),
    });

    return NextResponse.json({ ok: r.ok, id: r.id, error: r.error });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "policies_post_failed" },
      { status: 200 }
    );
  }
}
