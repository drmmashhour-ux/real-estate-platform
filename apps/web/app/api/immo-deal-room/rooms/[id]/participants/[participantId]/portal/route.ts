import { NextResponse } from "next/server";

import { requireImmoDealRoomActor } from "@/lib/immo-deal-room/api-auth";
import { getDealRoom } from "@/modules/deal-room/deal-room.service";
import {
  isPortalAccessLevel,
  parsePortalCapabilities,
} from "@/modules/deal-room/deal-room-portal.constants";
import type { DealRoomPortalCapability } from "@/modules/deal-room/deal-room-portal.types";
import { updateParticipantPortalAccess } from "@/modules/deal-room/deal-room-portal.service";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string; participantId: string }> }) {
  const actor = await requireImmoDealRoomActor();
  if (!actor.ok) return NextResponse.json({ error: actor.message }, { status: actor.status });

  const { id, participantId } = await ctx.params;
  const room = getDealRoom(id);
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const enabled = Boolean(body?.enabled);
  const accessLevelRaw =
    typeof body?.accessLevel === "string" ? body.accessLevel : enabled ? "" : "portal_read";
  const explicitCaps = body?.allowedCapabilities as unknown;

  if (!isPortalAccessLevel(accessLevelRaw)) {
    return NextResponse.json({ error: "Invalid accessLevel" }, { status: 400 });
  }

  let allowedCapabilities: DealRoomPortalCapability[] | undefined;
  if (explicitCaps !== undefined && explicitCaps !== null) {
    const parsed = parsePortalCapabilities(explicitCaps);
    if (!parsed) return NextResponse.json({ error: "Invalid allowedCapabilities" }, { status: 400 });
    allowedCapabilities = parsed;
  }

  const res = updateParticipantPortalAccess({
    roomId: id,
    participantId,
    enabled,
    accessLevel: accessLevelRaw,
    explicitCapabilities: allowedCapabilities,
    actorId: actor.userId,
    actorRole: actor.role,
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 403 });

  return NextResponse.json({
    ok: true,
    /** Returned when enabling — store securely; not shown again after this response. */
    portalToken: res.portalToken,
  });
}
