import { NextResponse } from "next/server";

import { requireImmoDealRoomActor } from "@/lib/immo-deal-room/api-auth";
import { assertCanViewRoom, getDealRoom } from "@/modules/deal-room/deal-room.service";
import { updateDocumentRequirementStatus } from "@/modules/deal-room/deal-room-document-workflow.service";
import type { DealRoomDocumentWorkflowStatus } from "@/modules/deal-room/deal-room-document-workflow.types";

export const dynamic = "force-dynamic";

const STATUSES = new Set<DealRoomDocumentWorkflowStatus>([
  "missing",
  "requested",
  "received",
  "under_review",
  "approved",
  "rejected",
  "expired",
]);

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
  const status = body?.status as DealRoomDocumentWorkflowStatus | undefined;
  const notes = typeof body?.notes === "string" ? body.notes : undefined;

  if (!status || !STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const res = updateDocumentRequirementStatus({
    roomId: id,
    requirementId,
    status,
    notes,
    actorId: actor.userId,
    actorRole: actor.role,
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 403 });
  return NextResponse.json({ ok: true });
}
