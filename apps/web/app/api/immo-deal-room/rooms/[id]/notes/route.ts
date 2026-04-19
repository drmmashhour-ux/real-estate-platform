import { NextResponse } from "next/server";

import { requireImmoDealRoomActor } from "@/lib/immo-deal-room/api-auth";
import { addNote, assertCanViewRoom, getDealRoom, listNotes } from "@/modules/deal-room/deal-room.service";
import type { DealRoomNoteAudience } from "@/modules/deal-room/deal-room.types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireImmoDealRoomActor();
  if (!actor.ok) return NextResponse.json({ error: actor.message }, { status: actor.status });

  const { id } = await ctx.params;
  const room = getDealRoom(id);
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!assertCanViewRoom({ userId: actor.userId, userRole: actor.role, room })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ notes: listNotes(id) });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireImmoDealRoomActor();
  if (!actor.ok) return NextResponse.json({ error: actor.message }, { status: actor.status });

  const { id } = await ctx.params;
  const room = getDealRoom(id);
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const text = typeof body?.body === "string" ? body.body : "";
  const aud = body?.audience;
  const audience =
    aud === "portal" || aud === "internal" ? (aud as DealRoomNoteAudience) : undefined;

  const res = addNote({
    roomId: id,
    body: text,
    authorId: actor.userId,
    authorRole: actor.role,
    audience,
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 403 });
  return NextResponse.json({ note: res.note });
}
