import { NextResponse } from "next/server";

import { requireImmoDealRoomActor } from "@/lib/immo-deal-room/api-auth";
import {
  assertCanViewRoom,
  createTask,
  getDealRoom,
  listTasks,
} from "@/modules/deal-room/deal-room.service";
import type { DealRoomTaskVisibility } from "@/modules/deal-room/deal-room.types";

export const dynamic = "force-dynamic";

const VIS = new Set<DealRoomTaskVisibility>(["internal", "portal"]);

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireImmoDealRoomActor();
  if (!actor.ok) return NextResponse.json({ error: actor.message }, { status: actor.status });

  const { id } = await ctx.params;
  const room = getDealRoom(id);
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!assertCanViewRoom({ userId: actor.userId, userRole: actor.role, room })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ tasks: listTasks(id) });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireImmoDealRoomActor();
  if (!actor.ok) return NextResponse.json({ error: actor.message }, { status: actor.status });

  const { id } = await ctx.params;
  const room = getDealRoom(id);
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description : undefined;
  const assignedTo = typeof body?.assignedTo === "string" ? body.assignedTo.trim() : undefined;
  const dueAt = typeof body?.dueAt === "string" ? body.dueAt : undefined;
  const visibility = body?.visibility as DealRoomTaskVisibility | undefined;
  if (visibility !== undefined && !VIS.has(visibility)) {
    return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });
  }

  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const res = createTask({
    roomId: id,
    title,
    description,
    assignedTo,
    dueAt,
    visibility,
    actorId: actor.userId,
    actorRole: actor.role,
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 403 });
  return NextResponse.json({ taskId: res.taskId });
}
