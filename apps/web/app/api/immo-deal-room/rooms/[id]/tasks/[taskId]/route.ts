import { NextResponse } from "next/server";

import { requireImmoDealRoomActor } from "@/lib/immo-deal-room/api-auth";
import { getDealRoom, updateTask } from "@/modules/deal-room/deal-room.service";
import type { DealRoomTaskStatus, DealRoomTaskVisibility } from "@/modules/deal-room/deal-room.types";

export const dynamic = "force-dynamic";

const STATUSES = new Set<DealRoomTaskStatus>(["todo", "doing", "done", "blocked"]);
const VIS = new Set<DealRoomTaskVisibility>(["internal", "portal"]);

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string; taskId: string }> }) {
  const actor = await requireImmoDealRoomActor();
  if (!actor.ok) return NextResponse.json({ error: actor.message }, { status: actor.status });

  const { id, taskId } = await ctx.params;
  const room = getDealRoom(id);
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const title = typeof body?.title === "string" ? body.title : undefined;
  const description = body?.description !== undefined ? (typeof body.description === "string" ? body.description : "") : undefined;
  const assignedTo =
    body?.assignedTo === null ? null : typeof body?.assignedTo === "string" ? body.assignedTo : undefined;
  const dueAt = body?.dueAt === null ? null : typeof body?.dueAt === "string" ? body.dueAt : undefined;
  const status = body?.status as DealRoomTaskStatus | undefined;
  if (status !== undefined && !STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid task status" }, { status: 400 });
  }

  const visibility = body?.visibility as DealRoomTaskVisibility | undefined;
  if (visibility !== undefined && !VIS.has(visibility)) {
    return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });
  }

  const res = updateTask({
    roomId: id,
    taskId,
    title,
    description: description ?? undefined,
    status,
    assignedTo: assignedTo === null ? undefined : assignedTo,
    dueAt,
    visibility,
    actorId: actor.userId,
    actorRole: actor.role,
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 403 });
  return NextResponse.json({ ok: true });
}
