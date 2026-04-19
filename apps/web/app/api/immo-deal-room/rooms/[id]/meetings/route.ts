import { NextResponse } from "next/server";

import { requireImmoDealRoomActor } from "@/lib/immo-deal-room/api-auth";
import {
  assertCanViewRoom,
  createDealRoomMeeting,
  getDealRoom,
  listMeetings,
} from "@/modules/deal-room/deal-room.service";
import type { DealRoomMeetingProvider } from "@/modules/deal-room/deal-room.types";

export const dynamic = "force-dynamic";

const PROVIDERS = new Set<DealRoomMeetingProvider>(["zoom", "teams", "manual"]);

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireImmoDealRoomActor();
  if (!actor.ok) return NextResponse.json({ error: actor.message }, { status: actor.status });

  const { id } = await ctx.params;
  const room = getDealRoom(id);
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!assertCanViewRoom({ userId: actor.userId, userRole: actor.role, room })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ meetings: listMeetings(id) });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireImmoDealRoomActor();
  if (!actor.ok) return NextResponse.json({ error: actor.message }, { status: actor.status });

  const { id } = await ctx.params;
  const room = getDealRoom(id);
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const provider = body?.provider as DealRoomMeetingProvider | undefined;
  const title = typeof body?.title === "string" ? body.title.trim() : "Meeting";
  const scheduledAt = typeof body?.scheduledAt === "string" ? body.scheduledAt : undefined;
  const manualUrl = typeof body?.manualUrl === "string" ? body.manualUrl : undefined;
  const portalVisible = body?.portalVisible === true;

  if (!provider || !PROVIDERS.has(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  const res = createDealRoomMeeting({
    roomId: id,
    provider,
    title,
    scheduledAt,
    manualUrl,
    portalVisible,
    actorId: actor.userId,
    actorRole: actor.role,
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 403 });
  return NextResponse.json({ meetingId: res.meetingId, url: res.url });
}
