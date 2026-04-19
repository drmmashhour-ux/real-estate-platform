import { NextResponse } from "next/server";

import { requireImmoDealRoomActor } from "@/lib/immo-deal-room/api-auth";
import { addParticipant, getDealRoom, removeParticipant } from "@/modules/deal-room/deal-room.service";
import type { DealRoomAccessLevel, DealRoomParticipantRole } from "@/modules/deal-room/deal-room.types";

export const dynamic = "force-dynamic";

const ROLES = new Set<DealRoomParticipantRole>([
  "admin",
  "operator",
  "broker",
  "buyer",
  "seller",
  "host",
  "guest",
  "reviewer",
]);

const LEVELS = new Set<DealRoomAccessLevel>(["read", "comment", "edit", "manage"]);

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireImmoDealRoomActor();
  if (!actor.ok) return NextResponse.json({ error: actor.message }, { status: actor.status });

  const { id } = await ctx.params;
  const room = getDealRoom(id);
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : undefined;
  const userId = typeof body?.userId === "string" ? body.userId.trim() : undefined;
  const role = body?.role as DealRoomParticipantRole | undefined;
  const accessLevel = body?.accessLevel as DealRoomAccessLevel | undefined;

  if (!displayName || !role || !ROLES.has(role) || !accessLevel || !LEVELS.has(accessLevel)) {
    return NextResponse.json({ error: "Invalid participant payload" }, { status: 400 });
  }

  const res = addParticipant({
    roomId: id,
    displayName,
    email: email || undefined,
    userId: userId || undefined,
    role,
    accessLevel,
    actorId: actor.userId,
    actorRole: actor.role,
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 403 });
  return NextResponse.json({ participantId: res.participantId });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireImmoDealRoomActor();
  if (!actor.ok) return NextResponse.json({ error: actor.message }, { status: actor.status });

  const { id } = await ctx.params;
  const room = getDealRoom(id);
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const participantId = typeof body?.participantId === "string" ? body.participantId : "";
  if (!participantId) return NextResponse.json({ error: "participantId required" }, { status: 400 });

  const res = removeParticipant({
    roomId: id,
    participantId,
    actorId: actor.userId,
    actorRole: actor.role,
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 403 });
  return NextResponse.json({ ok: true });
}
