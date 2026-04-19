import { NextResponse } from "next/server";

import { requireImmoDealRoomActor } from "@/lib/immo-deal-room/api-auth";
import { assertCanViewRoom, getDealRoom } from "@/modules/deal-room/deal-room.service";
import { setDocumentRequirementPortalShared } from "@/modules/deal-room/deal-room-document-workflow.service";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string; requirementId: string }> }) {
  const actor = await requireImmoDealRoomActor();
  if (!actor.ok) return NextResponse.json({ error: actor.message }, { status: actor.status });

  const { id, requirementId } = await ctx.params;
  const room = getDealRoom(id);
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!assertCanViewRoom({ userId: actor.userId, userRole: actor.role, room })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const portalShared = Boolean(body?.portalShared);

  const res = setDocumentRequirementPortalShared({
    roomId: id,
    requirementId,
    portalShared,
    actorId: actor.userId,
    actorRole: actor.role,
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 403 });
  return NextResponse.json({ ok: true });
}
