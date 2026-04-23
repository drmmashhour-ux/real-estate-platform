import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { PlatformRole } from "@prisma/client";
import {
  approveDecision,
  rejectDecision,
  applyDecision,
  rollbackDecision,
} from "@/modules/autonomy/autonomy-decision.service";

export const dynamic = "force-dynamic";

async function guardBrokerOrAdmin(userId: string) {
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (me?.role !== PlatformRole.BROKER && me?.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const forbidden = await guardBrokerOrAdmin(userId);
  if (forbidden) return forbidden;

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as {
    action?: "approve" | "reject" | "apply" | "rollback";
  };

  const action = body.action;
  if (!action || !["approve", "reject", "apply", "rollback"].includes(action)) {
    return NextResponse.json({ ok: false, error: "bad_action" }, { status: 400 });
  }

  try {
    switch (action) {
      case "approve":
        await approveDecision(id, userId);
        break;
      case "reject":
        await rejectDecision(id, userId);
        break;
      case "apply":
        await applyDecision(id);
        break;
      case "rollback":
        await rollbackDecision(id);
        break;
      default:
        return NextResponse.json({ ok: false }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
