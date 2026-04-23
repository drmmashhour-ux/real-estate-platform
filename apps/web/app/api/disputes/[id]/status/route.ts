import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getDisputeActor } from "@/modules/dispute-room/dispute-api-auth";
import { parseStatusBody, setDisputeStatus } from "@/modules/dispute-room/dispute-case.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actor = await getDisputeActor(request);
  if (actor instanceof NextResponse) return actor;

  const { id } = await ctx.params;
  const raw = await request.json().catch(() => null);
  const parsed = parseStatusBody(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await setDisputeStatus({
    disputeId: id,
    actorUserId: actor.userId,
    role: actor.role,
    nextStatus: parsed.status,
    resolutionNotes: parsed.resolutionNotes,
    internalAdminNotes:
      typeof (raw as Record<string, unknown>)?.internalAdminNotes === "string" ?
        String((raw as Record<string, unknown>).internalAdminNotes)
      : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.error === "not_found" ? 404 : 403 });
  }

  return NextResponse.json({ dispute: result.dispute });
}
