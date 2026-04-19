import { NextResponse } from "next/server";

import { requireImmoDealRoomActor } from "@/lib/immo-deal-room/api-auth";
import { addDocument, assertCanViewRoom, getDealRoom, listDocuments } from "@/modules/deal-room/deal-room.service";
import type { DealRoomDocumentKind } from "@/modules/deal-room/deal-room.types";

export const dynamic = "force-dynamic";

const KINDS = new Set<DealRoomDocumentKind>(["placeholder", "upload", "external_link"]);

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireImmoDealRoomActor();
  if (!actor.ok) return NextResponse.json({ error: actor.message }, { status: actor.status });

  const { id } = await ctx.params;
  const room = getDealRoom(id);
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!assertCanViewRoom({ userId: actor.userId, userRole: actor.role, room })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ documents: listDocuments(id) });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireImmoDealRoomActor();
  if (!actor.ok) return NextResponse.json({ error: actor.message }, { status: actor.status });

  const { id } = await ctx.params;
  const room = getDealRoom(id);
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const kind = body?.kind as DealRoomDocumentKind | undefined;
  const url = typeof body?.url === "string" ? body.url.trim() : undefined;

  if (!title || !kind || !KINDS.has(kind)) {
    return NextResponse.json({ error: "Invalid document payload" }, { status: 400 });
  }

  const res = addDocument({
    roomId: id,
    title,
    kind,
    url,
    actorId: actor.userId,
    actorRole: actor.role,
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 403 });
  return NextResponse.json({ documentId: res.documentId });
}
