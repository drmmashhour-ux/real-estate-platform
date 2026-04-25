import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdminSurface } from "@/lib/auth/is-platform-admin";
import { blockIfDemoWrite } from "@/lib/demo-mode-api";
import { logModerationAdminNote, ModerationError } from "@/lib/bnhub/verification";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = blockIfDemoWrite(request);
  if (blocked) return blocked;

  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdminSurface(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const note = typeof body?.note === "string" ? body.note : "";
    const log = await logModerationAdminNote(id, note, userId);
    return NextResponse.json({
      id: log.id,
      step: log.step,
      status: log.status,
      notes: log.notes,
      createdBy: log.createdBy,
      createdAt: log.createdAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof ModerationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[moderation/admin-note]", error);
    return NextResponse.json({ error: "Failed to save admin note" }, { status: 500 });
  }
}
