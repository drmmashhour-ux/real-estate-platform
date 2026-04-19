import { NextResponse } from "next/server";

import {
  buildPortalPayload,
  recordPortalViewOk,
  resolvePortalParticipant,
  touchPortalLastSeen,
} from "@/modules/deal-room/deal-room-portal.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await ctx.params;
  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim() ?? "";

  const participant = resolvePortalParticipant(roomId, token);
  if (!participant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const view = buildPortalPayload(participant);
  if (!view) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  touchPortalLastSeen(participant.id);
  recordPortalViewOk();

  return NextResponse.json({
    participantId: participant.id,
    view,
  });
}
