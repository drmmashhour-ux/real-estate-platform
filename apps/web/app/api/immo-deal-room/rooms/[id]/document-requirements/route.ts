import { NextResponse } from "next/server";

import { requireImmoDealRoomActor } from "@/lib/immo-deal-room/api-auth";
import { assertCanViewRoom, getDealRoom } from "@/modules/deal-room/deal-room.service";
import { addDocumentRequirement } from "@/modules/deal-room/deal-room-document-workflow.service";
import type { DealRoomDocumentCategory } from "@/modules/deal-room/deal-room-document-workflow.types";

export const dynamic = "force-dynamic";

const CATEGORIES = new Set<DealRoomDocumentCategory>([
  "identity",
  "property",
  "offer",
  "broker",
  "financial",
  "support",
  "other",
]);

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireImmoDealRoomActor();
  if (!actor.ok) return NextResponse.json({ error: actor.message }, { status: actor.status });

  const { id } = await ctx.params;
  const room = getDealRoom(id);
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!assertCanViewRoom({ userId: actor.userId, userRole: actor.role, room })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const category = body?.category as DealRoomDocumentCategory | undefined;
  const required = Boolean(body?.required);
  const notes = typeof body?.notes === "string" ? body.notes : undefined;
  const portalShared = body?.portalShared === true;

  if (!title || !category || !CATEGORIES.has(category)) {
    return NextResponse.json({ error: "Invalid title or category" }, { status: 400 });
  }

  const res = addDocumentRequirement({
    roomId: id,
    title,
    category,
    required,
    notes,
    portalShared,
    actorId: actor.userId,
    actorRole: actor.role,
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 403 });
  return NextResponse.json({ requirement: res.requirement });
}
