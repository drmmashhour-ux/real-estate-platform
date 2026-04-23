import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getDisputeActor } from "@/modules/dispute-room/dispute-api-auth";
import { escalateDispute } from "@/modules/dispute-room/dispute-case.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actor = await getDisputeActor(request);
  if (actor instanceof NextResponse) return actor;

  const { id } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const note = typeof body.note === "string" ? body.note.trim() : null;

  const result = await escalateDispute({
    disputeId: id,
    actorUserId: actor.userId,
    role: actor.role,
    note,
  });

  if (!result.ok) {
    const code =
      result.error === "not_found" ? 404
      : result.error === "case_closed" ? 409
      : 403;
    return NextResponse.json({ error: result.error }, { status: code });
  }

  return NextResponse.json({ dispute: result.dispute });
}
