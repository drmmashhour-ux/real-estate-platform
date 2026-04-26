import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import {
  approveAutonomousAction,
  executeApprovedAction,
  rejectAutonomousAction,
} from "@/modules/autonomy/approval.service";

export const dynamic = "force-dynamic";

/** POST — approve / reject / execute_after_approve */
export async function POST(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (me?.role !== PlatformRole.ADMIN && me?.role !== PlatformRole.BROKER) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      actionQueueId?: string;
      decision?: "approve" | "reject" | "execute";
      reason?: string;
      /** When true with approve, runs execute after approval (still draft-only for external comms). */
      executeAfterApprove?: boolean;
    };

    if (!body.actionQueueId || !body.decision) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 200 });
    }

    const row = await prisma.autonomousActionQueue.findUnique({
      where: { id: body.actionQueueId },
      select: { brokerId: true },
    });
    if (
      me?.role === PlatformRole.BROKER &&
      row?.brokerId &&
      row.brokerId !== userId
    ) {
      return NextResponse.json({ ok: false, error: "forbidden_queue" }, { status: 403 });
    }

    if (body.decision === "approve") {
      const r = await approveAutonomousAction(body.actionQueueId, userId, body.reason);
      if (!r.ok) return NextResponse.json({ ok: false, error: r.error ?? "approve_failed" }, { status: 200 });
      if (body.executeAfterApprove) {
        const ex = await executeApprovedAction(body.actionQueueId);
        return NextResponse.json({ ok: ex.ok, phase: "approved_and_executed", approve: r, execute: ex });
      }
      return NextResponse.json({ ok: true, phase: "approved_pending_execute", approve: r });
    }

    if (body.decision === "reject") {
      const r = await rejectAutonomousAction(body.actionQueueId, userId, body.reason);
      return NextResponse.json({ ok: r.ok, error: r.error });
    }

    if (body.decision === "execute") {
      const ex = await executeApprovedAction(body.actionQueueId);
      return NextResponse.json({ ok: ex.ok, execute: ex });
    }

    return NextResponse.json({ ok: false, error: "unknown_decision" }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "approve_route_failed" },
      { status: 200 }
    );
  }
}
