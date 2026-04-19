import { NextResponse } from "next/server";

import { requireImmoDealRoomActor } from "@/lib/immo-deal-room/api-auth";
import { assertCanViewRoom, getDealRoom } from "@/modules/deal-room/deal-room.service";
import { attachDocumentToRequirement } from "@/modules/deal-room/deal-room-document-workflow.service";
import type { DealRoomDocumentKind } from "@/modules/deal-room/deal-room.types";

export const dynamic = "force-dynamic";

const KINDS = new Set<DealRoomDocumentKind>(["placeholder", "upload", "external_link"]);

export async function POST(req: Request, ctx: { params: Promise<{ id: string; requirementId: string }> }) {
  const actor = await requireImmoDealRoomActor();
  if (!actor.ok) return NextResponse.json({ error: actor.message }, { status: actor.status });

  const { id, requirementId } = await ctx.params;
  const room = getDealRoom(id);
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!assertCanViewRoom({ userId: actor.userId, userRole: actor.role, room })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const existingDocumentId = typeof body?.existingDocumentId === "string" ? body.existingDocumentId.trim() : undefined;
  const title = typeof body?.title === "string" ? body.title : undefined;
  const kind = body?.kind as DealRoomDocumentKind | undefined;
  const url = typeof body?.url === "string" ? body.url : undefined;

  if (kind !== undefined && !KINDS.has(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }

  const res = attachDocumentToRequirement({
    roomId: id,
    requirementId,
    existingDocumentId,
    title,
    kind,
    url,
    actorId: actor.userId,
    actorRole: actor.role,
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 403 });
  return NextResponse.json({ documentId: res.documentId });
}
