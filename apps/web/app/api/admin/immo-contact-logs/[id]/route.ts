import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { mergeImmoResolution } from "@/lib/immo/immo-contact-resolution-metadata";

export const dynamic = "force-dynamic";

type PatchBody = {
  adminNote?: unknown;
  immoResolution?: Record<string, unknown>;
  /** Shortcut: mark workflow complete for ops. */
  markHandled?: unknown;
  disputeId?: unknown;
};

/** Admin-only: append note and/or update `metadata.immoResolution` (action required / done, dispute link). */
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  if (!id?.trim()) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const adminNoteRaw = body.adminNote;
  const hasAdminNote = typeof adminNoteRaw === "string" && adminNoteRaw.trim().length > 0;
  const adminNote = hasAdminNote ? adminNoteRaw.trim().slice(0, 8000) : undefined;
  const markHandled = body.markHandled === true;
  const disputeId =
    typeof body.disputeId === "string"
      ? body.disputeId.trim().slice(0, 64)
      : body.disputeId === null
        ? null
        : undefined;

  const immoPatch =
    body.immoResolution && typeof body.immoResolution === "object"
      ? (body.immoResolution as Record<string, unknown>)
      : undefined;

  if (!hasAdminNote && !immoPatch && !markHandled && disputeId === undefined) {
    return NextResponse.json(
      { error: "Provide adminNote, immoResolution, markHandled, or disputeId" },
      { status: 400 }
    );
  }

  const existing = await prisma.immoContactLog.findUnique({
    where: { id },
    select: { metadata: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const meta =
    existing.metadata && typeof existing.metadata === "object"
      ? (existing.metadata as Record<string, unknown>)
      : {};

  let newMetadata: Record<string, unknown> = { ...meta };

  if (immoPatch || markHandled || disputeId !== undefined) {
    newMetadata = mergeImmoResolution(newMetadata, {
      ...(immoPatch ?? {}),
      ...(markHandled ? ({ markCompleted: true } as const) : {}),
      ...(disputeId !== undefined ? { disputeId } : {}),
    });
  }

  const row = await prisma.immoContactLog.update({
    where: { id },
    data: {
      ...(hasAdminNote ? { adminNote, adminNotedAt: new Date(), adminNotedById: userId } : {}),
      ...(immoPatch || markHandled || disputeId !== undefined ? { metadata: newMetadata as object } : {}),
    },
    select: {
      id: true,
      adminNote: true,
      adminNotedAt: true,
      adminNotedById: true,
      metadata: true,
    },
  });

  return NextResponse.json({ ok: true, log: row });
}
