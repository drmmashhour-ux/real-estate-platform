import { NextResponse } from "next/server";
import type { LecipmOpportunityOutcomeKind } from "@prisma/client";
import { requireExecutionActor } from "@/modules/lecipm-autonomous-execution/execution-api-guard";
import { recordOpportunityOutcomeEvent } from "@/modules/opportunity-discovery/opportunity-actions.service";

export const dynamic = "force-dynamic";

const ALLOWED = new Set<LecipmOpportunityOutcomeKind>([
  "CONTACTED",
  "OFFER_SENT",
  "BOOKED",
  "INVESTED",
  "CLOSED",
  "DISMISSED",
]);

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireExecutionActor();
  if (!actor.ok) return actor.response;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const outcomeType = body?.outcomeType as LecipmOpportunityOutcomeKind | undefined;
  if (!outcomeType || !ALLOWED.has(outcomeType)) {
    return NextResponse.json({ error: "Invalid outcomeType" }, { status: 400 });
  }
  const outcomeValueJson =
    body?.outcomeValueJson && typeof body.outcomeValueJson === "object" ? body.outcomeValueJson : {};

  const r = await recordOpportunityOutcomeEvent({
    opportunityId: id,
    brokerUserId: actor.userId,
    actorUserId: actor.userId,
    outcomeType,
    outcomeValueJson: outcomeValueJson as Record<string, unknown>,
  });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 404 });
  return NextResponse.json({ success: true });
}
