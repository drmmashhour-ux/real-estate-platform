import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { setRepliesNote } from "@/src/modules/daily-execution/application/dailyTaskService";

export const dynamic = "force-dynamic";

/** POST { note } — optional end-of-day reply summary (manual). */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { note?: string | null };
  if (!("note" in body)) {
    return NextResponse.json({ error: "note field required (string or null)" }, { status: 400 });
  }
  const note =
    body.note === null || body.note === undefined
      ? null
      : typeof body.note === "string"
        ? body.note.trim().slice(0, 4000) || null
        : null;

  const result = await setRepliesNote(prisma, userId, note);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
