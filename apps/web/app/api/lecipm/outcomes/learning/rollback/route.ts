import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

import { recordLearningRollback } from "@/modules/outcomes/outcome-learning.service";

export const dynamic = "force-dynamic";

/**
 * Append-only rollback marker for a prior learning-audit entry (admin governance).
 * Does not mutate production weights; records audit trail for reversibility.
 */
export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const viewer = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (viewer?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    supersedesId?: unknown;
    note?: unknown;
  };
  const supersedesId = typeof body.supersedesId === "string" ? body.supersedesId.trim() : "";
  if (!supersedesId) {
    return NextResponse.json({ error: "supersedesId required" }, { status: 400 });
  }
  const prior = await prisma.lecipmLearningFeedbackAudit.findUnique({ where: { id: supersedesId } });
  if (!prior) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const note = typeof body.note === "string" && body.note.trim() ? body.note.trim().slice(0, 2000) : "rollback requested";
  await recordLearningRollback({
    supersedesId,
    previousPayload: prior.payload,
    note,
    actorUserId: userId,
  });
  return NextResponse.json({ ok: true });
}
