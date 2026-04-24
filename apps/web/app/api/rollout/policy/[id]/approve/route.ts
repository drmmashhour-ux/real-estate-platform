import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { approveRolloutPolicy } from "@/modules/rollout/rollout-policy.service";

export const dynamic = "force-dynamic";

/** POST /api/rollout/policy/[id]/approve — admin-only; starts gradual execution at 5%. */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ ok: false, error: "admin_required" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id?.trim()) return NextResponse.json({ ok: false, error: "id_required" }, { status: 400 });

  try {
    const result = await approveRolloutPolicy(id.trim(), userId);
    return NextResponse.json({ ok: true, policy: result.policy, execution: result.execution });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "approve_failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
