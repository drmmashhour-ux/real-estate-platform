import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Admin-only: append immutable event note (does not alter core event fields). */
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  if (!id?.trim()) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: { adminNote?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim().slice(0, 8000) : "";
  if (!adminNote) return NextResponse.json({ error: "adminNote required" }, { status: 400 });

  const row = await prisma.immoContactLog.update({
    where: { id },
    data: {
      adminNote,
      adminNotedAt: new Date(),
      adminNotedById: userId,
    },
    select: {
      id: true,
      adminNote: true,
      adminNotedAt: true,
      adminNotedById: true,
    },
  });

  return NextResponse.json({ ok: true, log: row });
}
