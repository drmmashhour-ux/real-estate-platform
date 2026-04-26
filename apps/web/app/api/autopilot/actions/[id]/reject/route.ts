import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { aiAutopilotV1Flags } from "@/config/feature-flags";
import { rejectAction } from "@/modules/ai-autopilot";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!aiAutopilotV1Flags.aiAutopilotV1) {
    return NextResponse.json({ error: "AI Autopilot v1 is disabled" }, { status: 403 });
  }
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await ctx.params;
  const row = await prisma.platformAutopilotAction.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.subjectUserId && row.subjectUserId !== userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  const notes = (await req.json().catch(() => ({}))) as { notes?: string };
  await rejectAction({ actionId: id, actorUserId: userId, notes: notes.notes });
  return NextResponse.json({ ok: true });
}
