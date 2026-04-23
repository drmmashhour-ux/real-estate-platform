import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getDisputeActor } from "@/modules/dispute-room/dispute-api-auth";
import { buildAssistiveSummary } from "@/modules/dispute-room/dispute-case.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actor = await getDisputeActor(request);
  if (actor instanceof NextResponse) return actor;

  const { id } = await ctx.params;
  const result = await buildAssistiveSummary({
    disputeId: id,
    userId: actor.userId,
    role: actor.role,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.error === "not_found" ? 404 : 403 });
  }

  return NextResponse.json(result.assist);
}
