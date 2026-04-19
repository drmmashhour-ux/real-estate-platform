import { NextResponse } from "next/server";

import { requireImmoDealRoomActor } from "@/lib/immo-deal-room/api-auth";
import { assertCanViewRoom, getDealRoom } from "@/modules/deal-room/deal-room.service";
import { applyDocumentChecklistTemplate } from "@/modules/deal-room/deal-room-document-workflow.service";
import type { DocumentChecklistTemplateId } from "@/modules/deal-room/deal-room-document-templates";

export const dynamic = "force-dynamic";

const TEMPLATES = new Set<DocumentChecklistTemplateId>(["buyer_lead", "broker_listing", "property_review"]);

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
  const templateId = body?.templateId as DocumentChecklistTemplateId | undefined;
  if (!templateId || !TEMPLATES.has(templateId)) {
    return NextResponse.json({ error: "Invalid templateId" }, { status: 400 });
  }

  const res = applyDocumentChecklistTemplate({
    roomId: id,
    templateId,
    actorId: actor.userId,
    actorRole: actor.role,
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 403 });
  return NextResponse.json({ added: res.added });
}
