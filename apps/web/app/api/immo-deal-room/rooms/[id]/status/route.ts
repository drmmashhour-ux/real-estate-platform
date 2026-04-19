import { NextResponse } from "next/server";

import { requireImmoDealRoomActor } from "@/lib/immo-deal-room/api-auth";
import { getDealRoom, updateDealRoomStatus } from "@/modules/deal-room/deal-room.service";
import type { DealRoomStatus } from "@/modules/deal-room/deal-room.types";

export const dynamic = "force-dynamic";

const STATUSES = new Set<DealRoomStatus>([
  "open",
  "active",
  "pending_review",
  "paused",
  "closed",
  "archived",
]);

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireImmoDealRoomActor();
  if (!actor.ok) return NextResponse.json({ error: actor.message }, { status: actor.status });

  const { id } = await ctx.params;
  const room = getDealRoom(id);
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const status = body?.status as DealRoomStatus | undefined;
  if (!status || !STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const res = updateDealRoomStatus({
    roomId: id,
    status,
    actorId: actor.userId,
    actorRole: actor.role,
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 403 });
  return NextResponse.json({ ok: true });
}
