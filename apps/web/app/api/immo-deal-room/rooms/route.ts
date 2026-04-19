import { NextResponse } from "next/server";

import { requireImmoDealRoomActor } from "@/lib/immo-deal-room/api-auth";
import {
  createDealRoom,
  listDealRoomsByEntity,
  listDealRoomsVisibleToUser,
} from "@/modules/deal-room/deal-room.service";
import type { DealRoomEntityType } from "@/modules/deal-room/deal-room.types";

export const dynamic = "force-dynamic";

const ENTITY: Set<DealRoomEntityType> = new Set(["listing", "lead", "broker", "booking", "property"]);

export async function GET(req: Request) {
  const actor = await requireImmoDealRoomActor();
  if (!actor.ok) return NextResponse.json({ error: actor.message }, { status: actor.status });

  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");

  if (entityType && entityId && ENTITY.has(entityType as DealRoomEntityType)) {
    const rooms = listDealRoomsByEntity(entityType as DealRoomEntityType, entityId);
    return NextResponse.json({ rooms });
  }

  const rooms = listDealRoomsVisibleToUser({ userId: actor.userId, userRole: actor.role });
  return NextResponse.json({ rooms });
}

export async function POST(req: Request) {
  const actor = await requireImmoDealRoomActor();
  if (!actor.ok) return NextResponse.json({ error: actor.message }, { status: actor.status });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const entityType = body?.entityType;
  const entityId = typeof body?.entityId === "string" ? body.entityId.trim() : "";
  const title = typeof body?.title === "string" ? body.title : undefined;
  const titleHint = typeof body?.titleHint === "string" ? body.titleHint : undefined;

  if (typeof entityType !== "string" || !ENTITY.has(entityType as DealRoomEntityType) || !entityId) {
    return NextResponse.json({ error: "Invalid entityType or entityId" }, { status: 400 });
  }

  const res = createDealRoom({
    entityType: entityType as DealRoomEntityType,
    entityId,
    title,
    titleHint,
    createdBy: actor.userId,
    creatorRole: actor.role,
    creatorDisplayName: actor.displayName,
    creatorEmail: actor.email ?? undefined,
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 403 });
  return NextResponse.json({ dealRoom: res.room });
}
