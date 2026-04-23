import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getDisputeActor } from "@/modules/dispute-room/dispute-api-auth";
import { postDisputeMessage } from "@/modules/dispute-room/dispute-case.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actor = await getDisputeActor(request);
  if (actor instanceof NextResponse) return actor;

  const { id } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "message_required" }, { status: 400 });
  }

  const result = await postDisputeMessage({
    disputeId: id,
    senderId: actor.userId,
    role: actor.role,
    message,
    attachments: body.attachments ?? null,
  });

  if (!result.ok) {
    const code =
      result.error === "not_found" ? 404
      : result.error === "case_closed" ? 409
      : 403;
    return NextResponse.json({ error: result.error }, { status: code });
  }

  return NextResponse.json({ message: result.message });
}
