import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getDisputeActor } from "@/modules/dispute-room/dispute-api-auth";
import { DISPUTE_COMPLIANCE_FOOTER, getDisputeDetailForUser } from "@/modules/dispute-room/dispute-case.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actor = await getDisputeActor(request);
  if (actor instanceof NextResponse) return actor;

  const { id } = await ctx.params;
  const detail = await getDisputeDetailForUser({
    disputeId: id,
    userId: actor.userId,
    role: actor.role,
  });

  if (!detail.ok) {
    return NextResponse.json({ error: detail.error }, { status: detail.error === "not_found" ? 404 : 403 });
  }

  return NextResponse.json({
    dispute: detail.dispute,
    timeline: detail.timeline,
    compliance: { footer: DISPUTE_COMPLIANCE_FOOTER },
  });
}
